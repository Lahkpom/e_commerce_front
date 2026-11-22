import type { ColorResponse } from '../../../types/products';

interface ColorsTableProps {
  colors: ColorResponse[];
  loading: boolean;
  canDelete: boolean;
  onEdit: (color: ColorResponse) => void;
  onStatus: (color: ColorResponse, deleting?: boolean) => void;
}

const ColorsTable = ({ colors, loading, canDelete, onEdit, onStatus }: ColorsTableProps) => (
  <div className="card">
    <div className="table-responsive">
      <table className="table table-striped table-hover align-middle mb-0">
        <thead><tr><th>Color</th><th>Nombre</th><th>Código</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={6} className="py-4 text-center">Cargando colores…</td></tr>
            : colors.length === 0 ? <tr><td colSpan={6} className="py-4 text-center">No hay colores para mostrar.</td></tr>
              : colors.map((color) => (
                <tr key={color.id}>
                  <td><span className="d-inline-block rounded-circle border" aria-label={color.code}
                    style={{ width: 28, height: 28, backgroundColor: color.code }} /></td>
                  <td>{color.name}</td><td><code>{color.code}</code></td><td>{color.desc}</td>
                  <td><span className={`badge ${color.rowStatus === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>{color.rowStatus}</span></td>
                  <td><div className="d-flex flex-wrap gap-1">
                    <button type="button" className="btn btn-sm btn-outline-primary" title={`Editar ${color.name}`}
                      aria-label={`Editar ${color.name}`} onClick={() => onEdit(color)}><i className="bi bi-pencil" aria-hidden="true" /></button>
                    <button type="button" className="btn btn-sm btn-outline-secondary"
                      title={`${color.rowStatus === 'ACTIVE' ? 'Desactivar' : 'Activar'} ${color.name}`}
                      aria-label={`${color.rowStatus === 'ACTIVE' ? 'Desactivar' : 'Activar'} ${color.name}`}
                      onClick={() => onStatus(color)}><i className="bi bi-arrow-repeat" aria-hidden="true" /></button>
                    {canDelete && <button type="button" className="btn btn-sm btn-outline-danger"
                      title={`Eliminar ${color.name}`} aria-label={`Eliminar ${color.name}`} onClick={() => onStatus(color, true)}>
                      <i className="bi bi-trash" aria-hidden="true" /></button>}
                  </div></td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ColorsTable;
