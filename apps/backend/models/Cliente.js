const mongoose=require('mongoose')
module.exports=mongoose.model('Cliente',new mongoose.Schema({
 id:{type:String,required:true,unique:true},nombre:{type:String,required:true},correo:{type:String,required:true},telefono:{type:String,required:true},estado:{type:String,default:'Activo'}
},{timestamps:true}))
