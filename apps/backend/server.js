const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const crypto = require('node:crypto')
require('dotenv').config()
const Cliente = require('./models/Cliente')
const { Empresa, Proveedor, Producto, Venta, Compra, Movimiento, Usuario } = require('./models/ERP')
const app = express()
app.use(cors())
app.use(express.json({ limit: '100kb' }))
// Autenticación con tokens HMAC y hash scrypt. AUTH_SECRET y SETUP_KEY son secretos del servidor.
const AUTH_SECRET = process.env.AUTH_SECRET || ''
const SETUP_KEY = process.env.SETUP_KEY || ''
const authError = (msg, status=401) => Object.assign(new Error(msg), {status})
const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
const sign = payload => crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url')
const tokenFor = user => {
  const payload = encode({sub:String(user._id), exp:Date.now()+8*60*60*1000})
  return `${payload}.${sign(payload)}`
}
const passwordHash = password => {
  const salt=crypto.randomBytes(16).toString('hex')
  return `${salt}:${crypto.scryptSync(password,salt,64).toString('hex')}`
}
const passwordMatches = (password, hash) => {
  if (!hash || typeof hash!=='string') return false
  const [salt,expected]=hash.split(':')
  if (!salt || !expected || !/^[a-f0-9]{128}$/.test(expected)) return false
  const actual=crypto.scryptSync(password,salt,64)
  return crypto.timingSafeEqual(actual,Buffer.from(expected,'hex'))
}
const publicUser = u => ({_id:u._id,id:u.id,nombre:u.nombre,correo:u.correo,rol:u.rol,estado:u.estado})
const validPassword = v => typeof v==='string' && v.length>=12 && v.length<=128
const loginAttempts = new Map()
app.post('/api/auth/login', async (req,res,next) => {
  try {
    if (!AUTH_SECRET) return res.status(503).json({mensaje:'Falta configurar AUTH_SECRET en el servidor'})
    const correo=String(req.body.correo||'').trim().toLowerCase()
    const password=req.body.password
    const key=`${req.ip}:${correo}`
    const attempts=loginAttempts.get(key)
    if (attempts && attempts.until>Date.now() && attempts.count>=5) return res.status(429).json({mensaje:'Demasiados intentos. Espera 15 minutos.'})
    const u=await Usuario.findOne({correo,estado:{$ne:'Inactivo'}}).select('+passwordHash')
    if (typeof password!=='string' || !u || !passwordMatches(password,u.passwordHash)) {
      const count=(attempts?.until>Date.now()?attempts.count:0)+1
      loginAttempts.set(key,{count,until:Date.now()+15*60*1000})
      return res.status(401).json({mensaje:'Correo o contraseña incorrectos'})
    }
    loginAttempts.delete(key)
    return res.json({token:tokenFor(u),usuario:publicUser(u)})
  } catch(e) {next(e)}
})
// Alta inicial: requiere clave de instalación, no permite crear otro administrador una vez activado.
app.post('/api/auth/setup', async (req,res,next) => {
  try {
    if (!AUTH_SECRET || !SETUP_KEY || SETUP_KEY.length<20) return res.status(503).json({mensaje:'Configura AUTH_SECRET y SETUP_KEY (mínimo 20 caracteres)'})
    const existing=await Usuario.exists({rol:'Administrador',passwordHash:{$exists:true,$ne:''}})
    if (existing) return res.status(409).json({mensaje:'El administrador inicial ya está configurado'})
    const supplied=String(req.body.setupKey||'')
    const aa=Buffer.from(supplied),bb=Buffer.from(SETUP_KEY)
    if (aa.length!==bb.length || !crypto.timingSafeEqual(aa,bb)) return res.status(403).json({mensaje:'Clave de instalación incorrecta'})
    const {nombre,correo,password}=req.body
    if (!nombre?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo||'') || !validPassword(password)) return res.status(400).json({mensaje:'Indica nombre, correo válido y contraseña de al menos 12 caracteres'})
    const normalized=correo.trim().toLowerCase()
    if(await Usuario.exists({correo:normalized})) return res.status(409).json({mensaje:'Ese correo ya existe. Usa uno nuevo para la cuenta inicial.'})
    const u=await Usuario.create({id:`USR-${crypto.randomUUID()}`,nombre:nombre.trim(),correo:normalized,rol:'Administrador',estado:'Activo',passwordHash:passwordHash(password)})
    res.status(201).json({token:tokenFor(u),usuario:publicUser(u)})
  } catch(e) {next(e)}
})
app.use('/api', async (req,res,next) => {
  try {
    if (!AUTH_SECRET) return res.status(503).json({mensaje:'Configura AUTH_SECRET en el backend'})
    const token=(req.headers.authorization||'').replace(/^Bearer /i,'')
    const [payload,signature]=token.split('.')
    if (!payload || !signature) throw authError('Inicia sesión para continuar')
    const a=Buffer.from(signature),b=Buffer.from(sign(payload))
    if (a.length!==b.length || !crypto.timingSafeEqual(a,b)) throw authError('Sesión inválida')
    let decoded
    try { decoded=JSON.parse(Buffer.from(payload,'base64url').toString('utf8')) } catch {throw authError('Sesión inválida')}
    if (!decoded.exp || decoded.exp<Date.now() || !mongoose.isValidObjectId(decoded.sub)) throw authError('Sesión vencida')
    const user=await Usuario.findById(decoded.sub).select('+passwordHash').lean()
    if (!user || user.estado==='Inactivo' || !user.passwordHash || !['Administrador','Empleado'].includes(user.rol)) throw authError('Acceso denegado',403)
    req.user=user
    if (user.rol!=='Administrador' && (req.path==='/usuarios' || req.path.startsWith('/usuarios/') || req.path==='/reportes')) return res.status(403).json({mensaje:'Permiso exclusivo del administrador'})
    next()
  } catch(e) {next(e)}
})
app.get('/api/auth/me',(req,res)=>res.json({usuario:publicUser(req.user)}))
// Administración de cuentas: nunca se envía passwordHash al navegador.
app.get('/api/usuarios',async(req,res,next)=>{try{res.json((await Usuario.find().sort({createdAt:-1}).lean()).map(publicUser))}catch(e){next(e)}})
app.post('/api/usuarios',async(req,res,next)=>{try{
  const {nombre,correo,rol,estado,password}=req.body
  if(!nombre?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo||'') || !['Administrador','Empleado'].includes(rol) || !['Activo','Inactivo'].includes(estado||'Activo') || !validPassword(password)) return res.status(400).json({mensaje:'Completa nombre, correo, rol y contraseña (mínimo 12 caracteres)'})
  const u=await Usuario.create({id:`USR-${crypto.randomUUID()}`,nombre:nombre.trim(),correo:correo.trim().toLowerCase(),rol,estado:estado||'Activo',passwordHash:passwordHash(password)})
  res.status(201).json(publicUser(u))
}catch(e){next(e)}})
app.put('/api/usuarios/:id',async(req,res,next)=>{try{
  const u=await Usuario.findById(req.params.id).select('+passwordHash')
  if(!u) return res.status(404).json({mensaje:'Usuario no encontrado'})
  const {nombre,correo,rol,estado,password}=req.body
  if(rol!==undefined && !['Administrador','Empleado'].includes(rol)) return res.status(400).json({mensaje:'Rol inválido'})
  if(estado!==undefined && !['Activo','Inactivo'].includes(estado)) return res.status(400).json({mensaje:'Estado inválido'})
  if(correo!==undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return res.status(400).json({mensaje:'Correo inválido'})
  if(password && !validPassword(password)) return res.status(400).json({mensaje:'La contraseña debe tener al menos 12 caracteres'})
  if(String(u._id)===String(req.user._id) && (rol==='Empleado'||estado==='Inactivo')) return res.status(400).json({mensaje:'No puedes quitarte tu propio acceso de administrador'})
  if(u.rol==='Administrador' && (rol==='Empleado'||estado==='Inactivo') && await Usuario.countDocuments({rol:'Administrador',estado:'Activo',passwordHash:{$exists:true,$ne:''}})<=1) return res.status(400).json({mensaje:'Debe existir al menos un administrador activo'})
  if(nombre!==undefined)u.nombre=nombre.trim()
  if(correo!==undefined)u.correo=correo.trim().toLowerCase()
  if(rol!==undefined)u.rol=rol
  if(estado!==undefined)u.estado=estado
  if(password)u.passwordHash=passwordHash(password)
  await u.save();res.json(publicUser(u))
}catch(e){next(e)}})
app.delete('/api/usuarios/:id',(_req,res)=>res.status(405).json({mensaje:'Desactiva la cuenta en lugar de eliminarla'}))

// Modo de demostración pública
const DEMO_MODE = process.env.DEMO_MODE === 'true'

if (DEMO_MODE) {
  app.use('/api', (req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return res.status(403).json({
        mensaje: 'Modo demostración: las modificaciones están deshabilitadas.'
      })
    }

    next()
  })
}
const PORT = Number(process.env.PORT) || 3000
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res,next)).catch(next)
const fail = (res,msg,code=400) => res.status(code).json({ mensaje: msg })
const valid = (body,fields) => fields.every(k => typeof body[k] === 'string' && body[k].trim())
const normalize = (route, raw, partial = false) => {
 const data = { ...raw }
 for (const key of ['_id', 'id', 'createdAt', 'updatedAt', '__v']) delete data[key]
 for (const key of ['nombre', 'correo', 'rfc', 'sku', 'telefono', 'estado']) {
  if (typeof data[key] === 'string') data[key] = data[key].trim()
 }
 if (typeof data.correo === 'string') data.correo = data.correo.toLowerCase()
 if (typeof data.rfc === 'string') data.rfc = data.rfc.toUpperCase()
 if (typeof data.sku === 'string') data.sku = data.sku.toUpperCase()
 if (!partial && !data.estado) data.estado = 'Activo'
 if ('estado' in data && !['Activo', 'Inactivo'].includes(data.estado)) throw Object.assign(new Error('Estado inválido'), {status:400})
 if ('telefono' in data && data.telefono !== '' && !/^\d{10}$/.test(data.telefono)) throw Object.assign(new Error('El teléfono debe tener exactamente 10 dígitos'), {status:400})
 if ('correo' in data && data.correo !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) throw Object.assign(new Error('Correo electrónico inválido'), {status:400})
 if ('rfc' in data && data.rfc !== '' && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(data.rfc)) throw Object.assign(new Error('El RFC debe tener un formato válido de 12 o 13 caracteres'), {status:400})
 if (route === 'usuarios' && 'nombre' in data && !/^[\p{L}\p{M} .'-]+$/u.test(data.nombre)) throw Object.assign(new Error('El nombre de usuario solo admite letras y espacios'), {status:400})
 if ('rol' in data && !['Administrador','Empleado'].includes(data.rol)) throw Object.assign(new Error('Rol inválido'), {status:400})
 return data
}
const id = prefix => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
const catalog = [
 ['clientes',Cliente,['nombre','correo','telefono'],'CLI'],
 ['empresas',Empresa,['nombre','rfc'],'EMP'],
 ['proveedores',Proveedor,['nombre','correo'],'PROV'],
 ['productos',Producto,['nombre','sku'],'PROD'],
]
for (const [route,Model,required,prefix] of catalog) {
 app.get(`/api/${route}`,wrap(async(req,res)=>res.json(await Model.find().sort({createdAt:-1}).lean())))
 app.post(`/api/${route}`,wrap(async(req,res)=>{
  if(!valid(req.body,required))return fail(res,`Campos obligatorios: ${required.join(', ')}`)
  const data={...normalize(route,req.body),id:id(prefix)}
  if(route==='productos'){
   data.precio=Number(req.body.precio);data.stock=Number(req.body.stock ?? 0);data.stockMinimo=Number(req.body.stockMinimo ?? 5)
   if(!Number.isFinite(data.precio)||data.precio<0||!Number.isInteger(data.stock)||data.stock<0||!Number.isInteger(data.stockMinimo)||data.stockMinimo<0)return fail(res,'Precio o existencias inválidos')
  }
  const result=await Model.create(data);res.status(201).json(result)
 }))
 app.put(`/api/${route}/:id`,wrap(async(req,res)=>{
  const data=normalize(route,req.body,true)
  if(route==='productos'){
   for(const k of ['precio','stock','stockMinimo'])if(k in data){data[k]=Number(data[k]);if(!Number.isFinite(data[k])||data[k]<0||(k!=='precio'&&!Number.isInteger(data[k])))return fail(res,'Valor numérico inválido')}
  }
  if(required.some(k => k in data && (typeof data[k] !== 'string' || !data[k].trim())))return fail(res,'No puedes vaciar campos obligatorios')
   const result=await Model.findByIdAndUpdate(req.params.id,{$set:data},{new:true,runValidators:true});if(!result)return fail(res,'Registro no encontrado',404);res.json(result)
 }))
 app.delete(`/api/${route}/:id`,wrap(async(req,res)=>{
  if(['clientes','proveedores'].includes(route))return fail(res,'Desactiva el registro para conservar el historial',405)
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
 const tipoCliente = venta && body.tipoCliente === 'general' ? 'general' : 'registrado'
 if (venta && body.tipoCliente !== undefined && !['general', 'registrado'].includes(body.tipoCliente)) {
  throw Object.assign(new Error('Tipo de cliente inválido'), {status:400})
 }
 const tercero = venta ? body.cliente : body.proveedor
 const ventaGeneral = venta && tipoCliente === 'general'
 let nombreTercero = ''
 if (!ventaGeneral) {
  if (!mongoose.isValidObjectId(tercero)) {
   throw Object.assign(new Error('El cliente o proveedor seleccionado no es válido'), {status:400})
  }
  const ModeloTercero = venta ? Cliente : Proveedor
  const registro = await ModeloTercero.findOne({_id:tercero, estado:{$ne:'Inactivo'}}).select('nombre').lean()
  if (!registro) {
   throw Object.assign(new Error('El cliente o proveedor no existe o está inactivo'), {status:400})
  }
  nombreTercero = registro.nombre
 }
 const grouped=new Map();for(const item of items){const k=String(item.producto);grouped.set(k,(grouped.get(k)||0)+item.cantidad)}
 const ids=[...grouped.keys()]
 const products=await Producto.find({_id:{$in:ids},estado:{$ne:'Inactivo'}})
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
   const operacion = {id:id(venta?'VEN':'COM'),items,total,estado:'Registrada'}
   if (venta) {
    operacion.tipoCliente = tipoCliente
    if (!ventaGeneral) { operacion.cliente = tercero; operacion.clienteNombre = nombreTercero }
   } else { operacion.proveedor = tercero }
   const [doc]=await Model.create([operacion],{session})
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
  if(err.status)return fail(res,err.message,err.status)
 res.status(err.status||500).json({mensaje:err.status?err.message:'Error interno del servidor'})
})
if(!process.env.MONGODB_URI){console.error('Falta MONGODB_URI en apps/backend/.env');process.exit(1)}
mongoose.connect(process.env.MONGODB_URI).then(()=>{
 console.log('MongoDB conectado correctamente')
 app.listen(PORT,()=>console.log(`Servidor ERP ejecutándose en http://localhost:${PORT}`))
}).catch(e=>{console.error('Error al conectar MongoDB:',e.message);process.exit(1)})
