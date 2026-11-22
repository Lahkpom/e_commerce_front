import { TARGET_GENDERS } from '../../../constants/products';
import type { UserRole } from '../../../types/auth';
import type { AdminProductResponse, PageResponse } from '../../../types/products';

interface ProductsTableProps {
  pageData: PageResponse<AdminProductResponse>;
  page: number;
  loading: boolean;
  saving: boolean;
  role: UserRole | null;
  onPageChange: (page: number) => void;
  onEdit: (product: AdminProductResponse) => void;
  onStatus: (product: AdminProductResponse, deleting?: boolean) => void;
}

const ProductsTable = ({ pageData, page, loading, saving, role, onPageChange, onEdit, onStatus }: ProductsTableProps) => (
  <div className="card">
    <div className="table-responsive">
      <table className="table table-striped table-hover align-middle mb-0">
        <thead><tr><th>Nombre</th><th>Género objetivo</th><th>Descripción corta</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={5} className="py-4 text-center">Cargando productos…</td></tr>
            : pageData.content.length === 0 ? <tr><td colSpan={5} className="py-4 text-center">No hay productos para mostrar.</td></tr>
              : pageData.content.map((product) => {
                const statusAction = product.status === 'ACTIVE' ? 'Desactivar' : 'Activar';
                return <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{TARGET_GENDERS.find((gender) => gender.value === product.targetGender)?.label ?? product.targetGender}</td>
                  <td>{product.shortDesc}</td>
                  <td><span className={`badge ${product.status === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>{product.status}</span></td>
                  <td><div className="d-flex flex-wrap gap-1">
                    <button type="button" className="btn btn-sm btn-outline-primary" disabled={saving} title="Editar producto" aria-label="Editar producto" onClick={() => onEdit(product)}>
                      <i className="bi bi-pencil" aria-hidden="true" />
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-secondary" title={`${statusAction} ${product.name}`} aria-label={`${statusAction} ${product.name}`} onClick={() => onStatus(product)}>
                      <i className="bi bi-arrow-repeat" aria-hidden="true" />
                    </button>
                    {role === 'ADMIN' && <button type="button" className="btn btn-sm btn-outline-danger" title={`Eliminar ${product.name}`} aria-label={`Eliminar ${product.name}`} onClick={() => onStatus(product, true)}>
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>}
                  </div></td>
                </tr>;
              })}
        </tbody>
      </table>
    </div>
    <div className="d-flex justify-content-between align-items-center gap-2 p-3">
      <span className="text-muted">Página {page + 1} de {Math.max(pageData.totalPages, 1)}</span>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 0 || loading} onClick={() => onPageChange(page - 1)}>Anterior</button>
        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page + 1 >= pageData.totalPages || loading} onClick={() => onPageChange(page + 1)}>Siguiente</button>
      </div>
    </div>
  </div>
);

export default ProductsTable;
