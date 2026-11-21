import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './AdminLayout.scss';

const navigation = [
  { label: 'Resumen', to: '/admin', end: true },
  { label: 'Productos', to: '/admin/productos', end: false },
  { label: 'Variantes', to: '/admin/variantes', end: false },
  { label: 'Colores', to: '/admin/colores', end: false },
  { label: 'Ventas', to: '/admin/ventas', end: false },
];

const upcomingSections = ['Devoluciones', 'Usuarios / Envíos'];

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
            <div>
              <strong>Administración</strong>
              <span className="admin-layout__role">{role ?? 'ADMIN'}</span>
            </div>
          </div>
          <nav aria-label="Navegación de administración">
            <ul className="admin-layout__nav">
              {navigation.map(({ label, to, end }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={end}
                    onClick={closeSidebar}
                    className={({ isActive }) => `admin-layout__link${isActive ? ' is-active' : ''}`}
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
            <div className="admin-layout__upcoming-title">Más herramientas</div>
            <ul className="admin-layout__nav">
              {upcomingSections.map((section) => (
                <li key={section}>
                  <button type="button" className="admin-layout__link is-disabled" disabled>
                    <span>{section}</span>
                    <span className="admin-layout__coming-soon">Próximamente</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="admin-layout__actions">
          <button type="button" className="admin-layout__action" onClick={() => navigate('/')}>
            Ir a la tienda
          </button>
          <button type="button" className="admin-layout__action is-logout" onClick={() => void signOut()}>
            Cerrar sesión
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
