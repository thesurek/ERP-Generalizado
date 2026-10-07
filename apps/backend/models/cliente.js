const mongoose = require('mongoose')

const clienteSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true
  },
  correo: {
    type: String,
    required: true
  },
  telefono: {
    type: String,
    required: true
  },
  estado: {
    type: String,
    default: 'Activo'
  }
})

const Cliente = mongoose.model('Cliente', clienteSchema)

module.exports = Cliente