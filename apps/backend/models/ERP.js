const mongoose=require('mongoose')
const base={id:{type:String,required:true,unique:true},estado:{type:String,enum:['Activo','Inactivo'],default:'Activo',set:v=>v===''?'Activo':v}}
const make=(name,fields)=>mongoose.model(name,new mongoose.Schema({...base,...fields},{timestamps:true}))
const Empresa=make('Empresa',{nombre:{type:String,required:true},rfc:{type:String,required:true},correo:String,telefono:String,direccion:String})
const Proveedor=make('Proveedor',{nombre:{type:String,required:true},correo:{type:String,required:true},telefono:String,direccion:String})
const Producto=make('Producto',{nombre:{type:String,required:true},sku:{type:String,required:true,unique:true},categoria:String,precio:{type:Number,required:true,min:0},stock:{type:Number,default:0,min:0},stockMinimo:{type:Number,default:5,min:0},descripcion:String})
const Usuario=make('Usuario',{nombre:{type:String,required:true},correo:{type:String,required:true,unique:true},rol:{type:String,enum:['Administrador','Gerente','Empleado'],default:'Empleado'}})
const item=new mongoose.Schema({producto:{type:mongoose.Schema.Types.ObjectId,ref:'Producto',required:true},cantidad:{type:Number,min:1,required:true},precio:{type:Number,min:0,required:true}},{_id:false})
const Venta=make('Venta',{estado:{
  type: String,
  enum: ['Registrada', 'Cancelada'],
  default: 'Registrada'
},cliente:{type:mongoose.Schema.Types.ObjectId,ref:'Cliente',required:true},items:[item],total:{type:Number,required:true,min:0}})
const Compra=make('Compra',{
  estado: {
    type: String,
    enum: ['Registrada', 'Cancelada'],
    default: 'Registrada'
  },proveedor:{type:mongoose.Schema.Types.ObjectId,ref:'Proveedor',required:true},items:[item],total:{type:Number,required:true,min:0}})
const Movimiento=make('Movimiento',{producto:{type:mongoose.Schema.Types.ObjectId,ref:'Producto',required:true},tipo:{type:String,enum:['Entrada','Salida'],required:true},cantidad:{type:Number,required:true,min:1},referencia:String,fecha:{type:Date,default:Date.now}})
module.exports={Empresa,Proveedor,Producto,Usuario,Venta,Compra,Movimiento}
