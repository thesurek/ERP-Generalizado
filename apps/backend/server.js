const express = require('express')
const cors = require('cors')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

let clientes = [
  {
    id: 'CLI-001',
    nombre: 'Distribuidora del Centro',
    correo: 'ventas@distribuidora.com',
    telefono: '222 123 4567',
    estado: 'Activo'
  },
  {
    id: 'CLI-002',
    nombre: 'Comercial Puebla',
    correo: 'contacto@comercial.mx',
    telefono: '222 765 4321',
    estado: 'Activo'
  },
  {
    id: 'CLI-003',
    nombre: 'Grupo Industrial MX',
    correo: 'administracion@grupo.mx',
    telefono: '222 456 7890',
    estado: 'Activo'
  }
]

app.get('/', (req, res) => {
  res.json({
    mensaje: 'API del ERP funcionando correctamente'
  })
})

app.get('/api/clientes', (req, res) => {
  res.json(clientes)
})

app.post('/api/clientes', (req, res) => {
  const { nombre, correo, telefono } = req.body

  if (!nombre || !correo || !telefono) {
    return res.status(400).json({
      mensaje: 'Todos los campos son obligatorios'
    })
  }

  const nuevoCliente = {
    id: `CLI-${String(clientes.length + 1).padStart(3, '0')}`,
    nombre,
    correo,
    telefono,
    estado: 'Activo'
  }

  clientes.push(nuevoCliente)

  res.status(201).json(nuevoCliente)
})

app.listen(PORT, () => {
  console.log(`Servidor ERP ejecutándose en http://localhost:${PORT}`)
})