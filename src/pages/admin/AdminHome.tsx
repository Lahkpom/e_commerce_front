import { Link } from 'react-router-dom';

const sections = [
  { title: 'Gestión de Productos', description: 'Administrá la información y disponibilidad de los productos.', to: '/admin/productos' },
  { title: 'Gestión de Variantes', description: 'Editá talles, colores, SKU, precios y stock.', to: '/admin/variantes' },
  { title: 'Gestión de Colores', description: 'Mantené los colores disponibles para las variantes.', to: '/admin/colores' },
  { title: 'Gestión de Ventas', description: 'Gestioná ventas, auditorías, pagos y comprobantes fiscales.', to: '/admin/ventas' },
  { title: 'Gestión de Usuarios', description: 'Administrá clientes, mayoristas y cuentas del equipo interno.', to: '/admin/usuarios' },
];

const AdminHome = () => (
  <section>
    <header className="mb-4">
      <h1 className="h2">Panel de administración</h1>
      <p className="text-muted mb-0">Elegí una sección para gestionar el catálogo.</p>
    </header>
    <div className="row g-3">
      {sections.map((section) => (
        <div className="col-12 col-lg-4" key={section.to}>
          <article className="card h-100 shadow-sm">
            <div className="card-body d-flex flex-column">
              <h2 className="h5">{section.title}</h2>
              <p className="text-muted">{section.description}</p>
              <Link className="btn btn-outline-primary mt-auto align-self-start" to={section.to}>
                Abrir sección
              </Link>
            </div>
          </article>
        </div>
      ))}
    </div>
  </section>
);

export default AdminHome;
