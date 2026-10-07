import './App.css'

function App() {
  return (
    <div className="erp">
      <aside className="sidebar">
        <div className="logo">
          <h2>ERP</h2>
          <span>Generalizado</span>
        </div>

        <nav>
          <button className="active">▦ Dashboard</button>
          <button>🏢 Empresas</button>
          <button>👥 Clientes</button>
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

              <button className="secondary-button">Ver todos</button>
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
      </main>
    </div>
  )
}

export default App