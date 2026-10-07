import { useState } from 'react'
import './App.css'

function App() {
  const [pagina, setPagina] = useState('dashboard')

  const [clientes, setClientes] = useState([
    {
      id: 'CLI-001',
      nombre: 'Distribuidora del Centro',
      correo: 'ventas@distribuidora.com',
      telefono: '222 123 4567',
      estado: 'Activo',
    },
    {
      id: 'CLI-002',
      nombre: 'Comercial Puebla',
      correo: 'contacto@comercial.mx',
      telefono: '222 765 4321',
      estado: 'Activo',
    },
    {
      id: 'CLI-003',
      nombre: 'Grupo Industrial MX',
      correo: 'administracion@grupo.mx',
      telefono: '222 456 7890',
      estado: 'Activo',
    },
  ])

  return (
    <div className="erp">
      <aside className="sidebar">
        <div className="logo">
          <h2>ERP</h2>
          <span>Generalizado</span>
        </div>

        <nav>
          <button
            className={pagina === 'dashboard' ? 'active' : ''}
            onClick={() => setPagina('dashboard')}
          >
            ▦ Dashboard
          </button>

          <button>🏢 Empresas</button>

          <button
            className={pagina === 'clientes' ? 'active' : ''}
            onClick={() => setPagina('clientes')}
          >
            👥 Clientes
          </button>

          <button>📦 Productos</button>
          <button>🛒 Ventas</button>
          <button>📋 Compras</button>
          <button>📊 Inventario</button>
          <button>📈 Reportes</button>
        </nav>

        <div className="sidebar-footer">
          <button>⚙ Configuración</button>
        </div>
      </aside>

      <main className="main">
        {pagina === 'dashboard' && <Dashboard />}

        {pagina === 'clientes' && (
          <Clientes
  clientes={clientes}
  setClientes={setClientes}
/>
        )}
      </main>
    </div>
  )
}

function Dashboard() {
  return (
    <>
      <header className="header">
        <div>
          <h1>Panel de control</h1>
          <p>Resumen general de la empresa</p>
        </div>

        <div className="user">
          <div className="avatar">A</div>

          <div>
            <strong>Administrador</strong>
            <span>Administrador general</span>
          </div>
        </div>
      </header>

      <section className="welcome">
        <div>
          <span>ERP GENERALIZADO</span>
          <h2>Bienvenido al sistema</h2>
          <p>
            Administra las principales áreas de tu empresa desde un solo lugar.
          </p>
        </div>

        <div className="status">
          <span className="status-dot"></span>
          Sistema activo
        </div>
      </section>

      <section className="cards">
        <div className="card">
          <div className="card-icon">👥</div>

          <div>
            <span>Clientes</span>
            <h3>128</h3>
            <small>+8 este mes</small>
          </div>
        </div>

        <div className="card">
          <div className="card-icon">📦</div>

          <div>
            <span>Productos</span>
            <h3>84</h3>
            <small>12 con stock bajo</small>
          </div>
        </div>

        <div className="card">
          <div className="card-icon">🛒</div>

          <div>
            <span>Ventas del mes</span>
            <h3>$45,280</h3>
            <small>+12.5% este mes</small>
          </div>
        </div>

        <div className="card">
          <div className="card-icon">📋</div>

          <div>
            <span>Pedidos</span>
            <h3>32</h3>
            <small>5 pendientes</small>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Actividad reciente</h3>
              <p>Últimos movimientos registrados</p>
            </div>

            <button className="secondary-button">
              Ver todos
            </button>
          </div>

          <div className="activity">
            <div className="activity-item">
              <div className="activity-icon">🛒</div>

              <div>
                <strong>Nueva venta registrada</strong>
                <p>Venta #V-00124 · $2,450.00</p>
              </div>

              <span>Hace 10 min</span>
            </div>

            <div className="activity-item">
              <div className="activity-icon">👤</div>

              <div>
                <strong>Nuevo cliente</strong>
                <p>Distribuidora del Centro</p>
              </div>

              <span>Hace 35 min</span>
            </div>

            <div className="activity-item">
              <div className="activity-icon">📦</div>

              <div>
                <strong>Inventario actualizado</strong>
                <p>Entrada de 25 productos</p>
              </div>

              <span>Hace 1 h</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <h3>Accesos rápidos</h3>
              <p>Operaciones frecuentes</p>
            </div>
          </div>

          <div className="quick-actions">
            <button>+ Nuevo cliente</button>
            <button>+ Registrar producto</button>
            <button>+ Nueva venta</button>
            <button>+ Nueva compra</button>
          </div>
        </div>
      </section>
    </>
  )
}

function Clientes({ clientes, setClientes }) {
    const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    correo: '',
    telefono: '',
  })

  const guardarCliente = (event) => {
    event.preventDefault()

    if (
      !nuevoCliente.nombre ||
      !nuevoCliente.correo ||
      !nuevoCliente.telefono
    ) {
      alert('Completa todos los campos')
      return
    }

    const cliente = {
      id: `CLI-${String(clientes.length + 1).padStart(3, '0')}`,
      nombre: nuevoCliente.nombre,
      correo: nuevoCliente.correo,
      telefono: nuevoCliente.telefono,
      estado: 'Activo',
    }

    setClientes([...clientes, cliente])

    setNuevoCliente({
      nombre: '',
      correo: '',
      telefono: '',
    })

    setMostrarFormulario(false)
  }
  return (
    <>
      <header className="header">
        <div>
          <h1>Clientes</h1>
          <p>Administración de clientes registrados</p>
        </div>

        <button
  className="primary-button"
  onClick={() => setMostrarFormulario(true)}
>
  + Nuevo cliente
</button>
      </header>

      {mostrarFormulario && (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <div>
          <h2>Nuevo cliente</h2>
          <p>Registra la información del cliente.</p>
        </div>

        <button
          className="close-button"
          onClick={() => setMostrarFormulario(false)}
        >
          ×
        </button>
      </div>

      <form onSubmit={guardarCliente}>
        <div className="form-group">
          <label>Nombre o empresa</label>

          <input
            type="text"
            placeholder="Ej. Empresa ABC"
            value={nuevoCliente.nombre}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                nombre: e.target.value,
              })
            }
          />
        </div>

        <div className="form-group">
          <label>Correo electrónico</label>

          <input
            type="email"
            placeholder="correo@empresa.com"
            value={nuevoCliente.correo}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                correo: e.target.value,
              })
            }
          />
        </div>

        <div className="form-group">
          <label>Teléfono</label>

          <input
            type="text"
            placeholder="222 000 0000"
            value={nuevoCliente.telefono}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                telefono: e.target.value,
              })
            }
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => setMostrarFormulario(false)}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="primary-button"
          >
            Guardar cliente
          </button>
        </div>
      </form>
    </div>
  </div>
)}<section className="panel">
        <div className="clients-header">
          <div>
            <h3>Lista de clientes</h3>
            <p>Consulta y administra la información de tus clientes.</p>
          </div>

          <input
            className="search-input"
            type="text"
            placeholder="Buscar cliente..."
          />
        </div>

        <div className="table-container">
          <table className="clients-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.id}</td>
                  <td>
                    <strong>{cliente.nombre}</strong>
                  </td>
                  <td>{cliente.correo}</td>
                  <td>{cliente.telefono}</td>

                  <td>
                    <span className="client-status">
                      {cliente.estado}
                    </span>
                  </td>

                  <td>
                    <button className="table-button">
                      Ver
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

export default App