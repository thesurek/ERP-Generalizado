const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

const Cliente = require('./models/Cliente')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())



app.get('/', (req, res) => {
  res.json({
    mensaje: 'API del ERP funcionando correctamente'
  })
})

app.get('/api/clientes', async (req, res) => {
  try {
    const clientes = await Cliente.find()

    res.json(clientes)
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener los clientes'
    })
  }
})

app.post('/api/clientes', async (req, res) => {
  try {
    const { nombre, correo, telefono } = req.body

    if (!nombre || !correo || !telefono) {
      return res.status(400).json({
        mensaje: 'Todos los campos son obligatorios'
      })
    }

    const cantidadClientes = await Cliente.countDocuments()

    const nuevoCliente = new Cliente({
      id: `CLI-${String(cantidadClientes + 1).padStart(3, '0')}`,
      nombre,
      correo,
      telefono,
      estado: 'Activo'
    })

    const clienteGuardado = await nuevoCliente.save()

    res.status(201).json(clienteGuardado)
  } catch (error) {
    console.error('Error al registrar cliente:', error)

    res.status(500).json({
      mensaje: 'Error al registrar el cliente'
    })
  }
})

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB conectado correctamente')

    app.listen(PORT, () => {
      console.log(`Servidor ERP ejecutándose en http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Error al conectar con MongoDB:', error.message)
  })