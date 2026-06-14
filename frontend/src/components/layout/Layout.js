import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Layout.css';

const NAV = [
  { section: 'Principal' },
  { to: '/dashboard',   icon: '⊞',  label: 'Inicio' },
  { section: 'Ventas' },
  { to: '/clientes',    icon: '👥',  label: 'Clientes' },
  { to: '/facturacion', icon: '🧾',  label: 'Facturación' },
  { to: '/cobranzas',   icon: '💰',  label: 'Cobranzas' },
  { to: '/pedidos',     icon: '🛒',  label: 'Pedidos' },
  { section: 'Inventario' },
  { to: '/articulos',   icon: '📦',  label: 'Artículos' },
  { to: '/stock',       icon: '📊',  label: 'Stock' },
  { to: '/compras',     icon: '🚚',  label: 'Compras' },
  { section: 'Finanzas' },
  { to: '/caja',        icon: '👛',  label: 'Caja' },
  { to: '/bancos',      icon: '🏦',  label: 'Bancos' },
  { section: 'Maestros' },
  { to: '/vendedores',  icon: '🤝',  label: 'Vendedores' },
  { to: '/proveedores', icon: '🏪',  label: 'Proveedores' },
  { section: 'Sistema' },
  { to: '/reportes',    icon: '📈',  label: 'Reportes' },
  { to: '/config',      icon: '⚙️',  label: 'Configuración' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">⚡</span>
          <div>
            <div className="logo-title">Zeppelin Web</div>
            <div className="logo-sub">Sistema de Gestión</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item, i) =>
            item.section ? (
              <div key={i} className="nav-section">{item.section}</div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.nombre?.[0]?.toUpperCase() || 'U'}</div>
          <div className="user-info">
            <div className="user-name">{user?.nombre}</div>
            <div className="user-role">{user?.es_admin ? 'Administrador' : 'Usuario'}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">↩</button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
