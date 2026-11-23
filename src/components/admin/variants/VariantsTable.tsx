import type { UserRole } from '../../../types/auth';
import type { AdminVariantResponse, PageResponse } from '../../../types/products';

interface VariantsTableProps {
  pageData: PageResponse<AdminVariantResponse>;
  page: number;
  loading: boolean;
  saving: boolean;
  role: UserRole | null;
  onPageChange: (page: number) => void;
  onEdit: (variant: AdminVariantResponse) => void;
  onStatus: (variant: AdminVariantResponse, deleting?: boolean) => void;
}

const VariantsTable = ({ pageData, page, loading, saving, role, onPageChange, onEdit, onStatus }: VariantsTableProps) => (
  <div className="card">
    <div className="table-responsive">
      <table className="table table-striped table-hover align-middle mb-0">
        <thead><tr><th>Producto</th><th>Color</th><th>Talle</th><th>SKU</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={8} className="py-4 text-center">Cargando variantes…</td></tr>
            : pageData.content.length === 0 ? <tr><td colSpan={8} className="py-4 text-center">No hay variantes para mostrar.</td></tr>
              : pageData.content.map((variant) => <tr key={variant.id}>
                <td>{variant.productName}</td>
                <td><span className="d-inline-block rounded-circle border me-1 align-middle" aria-label={variant.colorCode} style={{ width: 18, height: 18, backgroundColor: variant.colorCode }} /><span>{variant.colorName}</span></td>
                <td>{variant.size.replace(/_/g, ' ').replace('T ', '')}</td><td>{variant.sku}</td><td>{variant.price}</td><td>{variant.stock}</td>
                <td><span className={`badge ${variant.rowStatus === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>{variant.rowStatus}</span></td>
                <td><div className="d-flex flex-wrap gap-1">
                  <button type="button" className="btn btn-sm btn-outline-primary" disabled={saving} title="Editar variante" aria-label="Editar variante" onClick={() => onEdit(variant)}><i className="bi bi-pencil" aria-hidden="true" /></button>
                  <button type="button" className="btn btn-sm btn-outline-secondary" title={`${variant.rowStatus === 'ACTIVE' ? 'Desactivar' : 'Activar'} ${variant.sku}`} aria-label={`${variant.rowStatus === 'ACTIVE' ? 'Desactivar' : 'Activar'} ${variant.sku}`} onClick={() => onStatus(variant)}><i className="bi bi-arrow-repeat" aria-hidden="true" /></button>
                  {role === 'ADMIN' && <button type="button" className="btn btn-sm btn-outline-danger" title={`Eliminar ${variant.sku}`} aria-label={`Eliminar ${variant.sku}`} onClick={() => onStatus(variant, true)}><i className="bi bi-trash" aria-hidden="true" /></button>}
                </div></td>
              </tr>)}
        </tbody>
      </table>
    </div>
    <div className="d-flex justify-content-between align-items-center gap-2 p-3">
      <span className="text-muted">Página {page + 1} de {Math.max(pageData.page.totalPages, 1)}</span>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 0 || loading} onClick={() => onPageChange(page - 1)}>Anterior</button>
        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page + 1 >= pageData.page.totalPages || loading} onClick={() => onPageChange(page + 1)}>Siguiente</button>
      </div>
    </div>
  </div>
);

export default VariantsTable;
