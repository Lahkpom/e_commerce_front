import type { UserResponse, UserSegment } from '../../../types/auth';

interface UsersTableProps {
  users: UserResponse[];
  segment: UserSegment;
  isAdmin: boolean;
  saving: boolean;
  loading: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  onEdit: (user: UserResponse) => void;
  onStatus: (user: UserResponse, deleting?: boolean) => void;
  onPage: (page: number) => void;
}

const UsersTable = ({ users, segment, isAdmin, saving, loading, page, totalPages, totalElements, onEdit, onStatus, onPage }: UsersTableProps) => (
  <div className="card">
    <div className="table-responsive">
      <table className="table table-striped table-hover align-middle mb-0">
        <thead><tr><th>Nombre / Razón Social</th><th>Email</th><th>Teléfono</th><th>Rol</th><th>Documento fiscal</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={7} className="py-4 text-center">Cargando usuarios…</td></tr>
            : users.length === 0 ? <tr><td colSpan={7} className="py-4 text-center">No hay usuarios para mostrar.</td></tr>
              : users.map((user) => (
                <tr key={user.userId}>
                  <td><div>{user.userName}</div>{user.companyName && <small className="text-muted">{user.companyName}</small>}</td>
                  <td>{user.userEmail}</td><td>{user.userPhone || '—'}</td>
                  <td><span className="badge text-bg-primary">{user.userRole}</span></td>
                  <td>{user.taxIdType && user.taxIdNumber ? `${user.taxIdType}: ${user.taxIdNumber}` : '—'}</td>
                  <td><span className={`badge ${user.rowStatus === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>{user.rowStatus}</span></td>
                  <td><div className="d-flex flex-wrap gap-1">
                    {segment === 'CLIENTS' && <button type="button" className="btn btn-sm btn-outline-primary" disabled={saving}
                      title={`Editar ${user.userName}`} aria-label={`Editar ${user.userName}`} onClick={() => onEdit(user)}>
                      <i className="bi bi-pencil" aria-hidden="true" /></button>}
                    <button type="button" className="btn btn-sm btn-outline-secondary" disabled={saving}
                      title={`${user.rowStatus === 'ACTIVE' ? 'Desactivar' : 'Activar'} ${user.userName}`}
                      aria-label={`${user.rowStatus === 'ACTIVE' ? 'Desactivar' : 'Activar'} ${user.userName}`}
                      onClick={() => onStatus(user)}><i className="bi bi-arrow-repeat" aria-hidden="true" /></button>
                    {isAdmin && <button type="button" className="btn btn-sm btn-outline-danger" disabled={saving}
                      title={`Eliminar ${user.userName}`} aria-label={`Eliminar ${user.userName}`}
                      onClick={() => onStatus(user, true)}><i className="bi bi-trash" aria-hidden="true" /></button>}
                  </div></td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 p-3">
      <span className="text-muted">Página {page + 1} de {Math.max(totalPages, 1)} · {totalElements} usuarios</span>
      <div className="d-flex gap-2">
        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 0 || loading} onClick={() => onPage(page - 1)}>Anterior</button>
        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page + 1 >= totalPages || loading} onClick={() => onPage(page + 1)}>Siguiente</button>
      </div>
    </div>
  </div>
);

export default UsersTable;
