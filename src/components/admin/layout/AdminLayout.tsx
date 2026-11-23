import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import './AdminLayout.scss';

const navigation = [
  { label: 'Resumen', to: '/admin', end: true, icon: 'bi-speedometer2' },
  { label: 'Productos', to: '/admin/productos', end: false, icon: 'bi-box-seam' },
  { label: 'Variantes', to: '/admin/variantes', end: false, icon: 'bi-tags' },
  { label: 'Colores', to: '/admin/colores', end: false, icon: 'bi-palette' },
  { label: 'Ventas', to: '/admin/ventas', end: false, icon: 'bi-receipt' },
  { label: 'Devoluciones', to: '/admin/devoluciones', end: false, icon: 'bi-arrow-return-left' },
  { label: 'Usuarios', to: '/admin/usuarios', end: false, icon: 'bi-people' },
];

const upcomingSections = [
  { label: 'Envíos', icon: 'bi-truck' },
];

const AdminLayout = () => {
  const { role, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-layout">
      <button
        className="admin-layout__menu-toggle"
        type="button"
        aria-label={sidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((open) => !open)}
      >
        ☰
      </button>
      {sidebarOpen && (
        <button
          type="button"
          className="admin-layout__backdrop"
          aria-label="Cerrar menú"
          onClick={closeSidebar}
        />
      )}
      <aside className={`admin-layout__sidebar${sidebarOpen ? ' is-open' : ''}`}>
        <div>
          <div className="admin-layout__brand">
            <span className="admin-layout__brand-mark">CF</span>
            <div className="admin-layout__brand-copy">
              <strong>Administración</strong>
              <span className="admin-layout__role">{role ?? 'ADMIN'}</span>
            </div>
          </div>
          <nav aria-label="Navegación de administración">
            <ul className="admin-layout__nav">
              {navigation.map(({ label, to, end, icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    title={label}
                    onClick={closeSidebar}
                    className={({ isActive }) => `admin-layout__link${isActive ? ' is-active' : ''}`}
                  >
                    <span className="admin-layout__icon" aria-hidden="true">
                      <i className={`bi ${icon}`} />
                    </span>
                    <span className="admin-layout__label">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="admin-layout__upcoming-title">Más herramientas</div>
            <ul className="admin-layout__nav">
              {upcomingSections.map(({ label, icon }) => (
                <li key={label}>
                  <button type="button" className="admin-layout__link is-disabled" title={label} disabled>
                    <span className="admin-layout__icon" aria-hidden="true">
                      <i className={`bi ${icon}`} />
                    </span>
                    <span className="admin-layout__label">{label}</span>
                    <span className="admin-layout__coming-soon">Próximamente</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="admin-layout__actions">
          <button
            type="button"
            className="admin-layout__action"
            title="Ir a la tienda"
            onClick={() => navigate('/')}
          >
            <span className="admin-layout__icon" aria-hidden="true">
              <i className="bi bi-shop" />
            </span>
            <span className="admin-layout__label">Ir a la tienda</span>
          </button>
          <button
            type="button"
            className="admin-layout__action is-logout"
            title="Cerrar sesión"
            onClick={() => void signOut()}
          >
            <span className="admin-layout__icon" aria-hidden="true">
              <i className="bi bi-box-arrow-right" />
            </span>
            <span className="admin-layout__label">Cerrar sesión</span>
          </button>
        </div>
      </aside>
      <main className="admin-layout__main">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
