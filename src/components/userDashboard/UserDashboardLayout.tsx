import { NavLink, Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import './UserDashboardLayout.scss';

const sections = [
  { label: 'Mi cuenta', path: '/mi_cuenta', end: true },
  { label: 'Mis compras', path: '/mi_cuenta/ordenes_activas', end: false },
];

const UserDashboardLayout = () => {
  const { user, role } = useAuth();

  return (
    <section className="user-dashboard container py-4 py-lg-5">
      <header className="user-dashboard__header mb-4">
        <div>
          <p className="text-muted mb-1">Tu espacio personal</p>
          <h1 className="h2 mb-0">Hola, {user?.userName ?? 'Usuario'}</h1>
        </div>
        {role && <span className="badge rounded-pill text-bg-primary">{role}</span>}
      </header>

      <nav className="user-dashboard__mobile-nav nav nav-pills mb-4" aria-label="Secciones de mi cuenta">
        {sections.map(({ label, path, end }) => (
          <NavLink
            key={path}
            to={path}
            end={end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="user-dashboard__content">
        <aside className="user-dashboard__sidebar" aria-label="Navegación de mi cuenta">
          <nav className="nav nav-pills flex-column">
            {sections.map(({ label, path, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="user-dashboard__main">
          <Outlet />
        </main>
      </div>
    </section>
  );
};

export default UserDashboardLayout;
