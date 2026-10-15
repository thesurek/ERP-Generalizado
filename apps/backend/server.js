const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()
const Cliente = require('./models/Cliente')
const { Empresa, Proveedor, Producto, Venta, Compra, Movimiento, Usuario } = require('./models/ERP')
const app = express()
app.use(cors())
app.use(express.json({ limit: '100kb' }))
const PORT = Number(process.env.PORT) || 3000
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next)
const fail = (res,msg,code=400) => res.status(code).json({ mensaje: msg })
const valid = (body,fields) => fields.every(k => typeof body[k] === 'string' && body[k].trim())
const id = prefix => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
const catalog = [
 ['clientes',Cliente,['nombre','correo','telefono'],'CLI'],
 ['empresas',Empresa,['nombre','rfc'],'EMP'],
 ['proveedores',Proveedor,['nombre','correo'],'PROV'],
 ['productos',Producto,['nombre','sku'],'PROD'],
 ['usuarios',Usuario,['nombre','correo'],'USR']
]
for (const [route,Model,required,prefix] of catalog) {
 app.get(`/api/${route}`,wrap(async(req,res)=>res.json(await Model.find().sort({createdAt:-1}).lean())))
 app.post(`/api/${route}`,wrap(async(req,res)=>{
  if(!valid(req.body,required))return fail(res,`Campos obligatorios: ${required.join(', ')}`)
  const data={...req.body,id:id(prefix)}
  if(route==='productos'){
   data.precio=Number(req.body.precio);data.stock=Number(req.body.stock ?? 0);data.stockMinimo=Number(req.body.stockMinimo ?? 5)
   if(!Number.isFinite(data.precio)||data.precio<0||!Number.isInteger(data.stock)||data.stock<0||!Number.isInteger(data.stockMinimo)||data.stockMinimo<0)return fail(res,'Precio o existencias inválidos')
  }
  const result=await Model.create(data);res.status(201).json(result)
 }))
 app.put(`/api/${route}/:id`,wrap(async(req,res)=>{
  const data={...req.body};delete data._id;delete data.id;delete data.createdAt;delete data.updatedAt
  if(route==='productos'){
   for(const k of ['precio','stock','stockMinimo'])if(k in data){data[k]=Number(data[k]);if(!Number.isFinite(data[k])||data[k]<0||(k!=='precio'&&!Number.isInteger(data[k])))return fail(res,'Valor numérico inválido')}
  }
  const result=await Model.findByIdAndUpdate(req.params.id,{$set:data},{new:true,runValidators:true});if(!result)return fail(res,'Registro no encontrado',404);res.json(result)
 }))
 app.delete(`/api/${route}/:id`,wrap(async(req,res)=>{
  if(route==='productos' && (await Venta.exists({'items.producto':req.params.id}) || await Compra.exists({'items.producto':req.params.id})))return fail(res,'El producto tiene movimientos y no se puede eliminar',409)
  const result=await Model.findByIdAndDelete(req.params.id);if(!result)return fail(res,'Registro no encontrado',404);res.json({mensaje:'Registro eliminado'})
 }))
}
function parseItems(items){
 if(!Array.isArray(items)||!items.length)throw Object.assign(new Error('Agrega al menos un producto'),{status:400})
 return items.map(x=>{
  const cantidad=Number(x.cantidad),precio=Number(x.precio)
  if(!mongoose.isValidObjectId(x.producto)||!Number.isInteger(cantidad)||cantidad<=0||!Number.isFinite(precio)||precio<0)throw Object.assign(new Error('Detalle de productos inválido'),{status:400})
  return {producto:x.producto,cantidad,precio}
 })
}
async function registrarOperacion(tipo,body){
 const venta=tipo==='ventas',Model=venta?Venta:Compra,items=parseItems(body.items)
 const tercero=venta?body.cliente:body.proveedor
 if(!mongoose.isValidObjectId(tercero)||!(await (venta?Cliente:Proveedor).exists({_id:tercero})))throw Object.assign(new Error('Cliente o proveedor no válido'),{status:400})
 const grouped=new Map();for(const item of items){const k=String(item.producto);grouped.set(k,(grouped.get(k)||0)+item.cantidad)}
 const ids=[...grouped.keys()]
 const products=await Producto.find({_id:{$in:ids}})
 if(products.length!==ids.length)throw Object.assign(new Error('Hay productos que no existen'),{status:400})
 const total=items.reduce((s,x)=>s+x.cantidad*x.precio,0)
 // MongoDB Atlas supports transactions on replica sets. All inventory changes and the operation commit together.
 const session=await mongoose.startSession()
 try{
  let created
  await session.withTransaction(async()=>{
   for(const [productId,cantidad] of grouped){
    const filter=venta?{_id:productId,stock:{$gte:cantidad}}:{_id:productId}
    const changed=await Producto.updateOne(filter,{$inc:{stock:venta?-cantidad:cantidad}},{session})
    if(changed.modifiedCount!==1)throw Object.assign(new Error('Existencias insuficientes o producto inexistente'),{status:409})
   }
   const [doc]=await Model.create([{id:id(venta?'VEN':'COM'),[venta?'cliente':'proveedor']:tercero,items,total,estado:'Registrada'}],{session})
   created=doc
   await Movimiento.insertMany(items.map(item=>({id:id('MOV'),producto:item.producto,tipo:venta?'Salida':'Entrada',cantidad:item.cantidad,referencia:doc.id,fecha:new Date()})),{session})
  })
  return created
 }finally{await session.endSession()}
}
for(const [route,Model] of [['ventas',Venta],['compras',Compra]]){
 app.get(`/api/${route}`,wrap(async(req,res)=>res.json(await Model.find().populate(route==='ventas'?'cliente':'proveedor','nombre').populate('items.producto','nombre sku').sort({createdAt:-1}).lean())))
 app.post(`/api/${route}`,wrap(async(req,res)=>res.status(201).json(await registrarOperacion(route,req.body))))
}
app.get('/api/inventario',wrap(async(req,res)=>res.json(await Producto.find().sort({nombre:1}).lean())))
app.get('/api/movimientos',wrap(async(req,res)=>res.json(await Movimiento.find().populate('producto','nombre sku').sort({createdAt:-1}).limit(200).lean())))
app.get('/api/dashboard',wrap(async(req,res)=>{
 const [clientes,productos,empresas,proveedores,ventas,compras,stockBajo]=await Promise.all([
 Cliente.countDocuments(),Producto.countDocuments(),Empresa.countDocuments(),Proveedor.countDocuments(),Venta.find().lean(),Compra.find().lean(),Producto.countDocuments({$expr:{$lte:['$stock','$stockMinimo']}})
 ])
 res.json({clientes,productos,empresas,proveedores,ventas:ventas.length,compras:compras.length,ingresos:ventas.reduce((a,x)=>a+x.total,0),egresos:compras.reduce((a,x)=>a+x.total,0),stockBajo})
}))
app.get('/api/reportes',wrap(async(req,res)=>{
 const [ventas,compras,productos,movimientos]=await Promise.all([Venta.find().sort({createdAt:-1}).lean(),Compra.find().sort({createdAt:-1}).lean(),Producto.find().lean(),Movimiento.find().sort({createdAt:-1}).limit(30).populate('producto','nombre').lean()])
 res.json({ventas,compras,productos,movimientos})
}))
app.get('/',(req,res)=>res.json({mensaje:'API del ERP funcionando correctamente'}))
app.use((err,req,res,next)=>{
 console.error(err.message)
 if(err.code===11000)return fail(res,'Ya existe un registro con ese valor único',409)
 if(err.name==='ValidationError'||err.name==='CastError')return fail(res,err.message)
 res.status(err.status||500).json({mensaje:err.status?err.message:'Error interno del servidor'})
})
if(!process.env.MONGODB_URI){console.error('Falta MONGODB_URI en apps/backend/.env');process.exit(1)}
mongoose.connect(process.env.MONGODB_URI).then(()=>{
 console.log('MongoDB conectado correctamente')
 app.listen(PORT,()=>console.log(`Servidor ERP ejecutándose en http://localhost:${PORT}`))
}).catch(e=>{console.error('Error al conectar MongoDB:',e.message);process.exit(1)})
