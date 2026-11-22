import type { UserSegment } from '../../../types/auth';

type CustomerRoleFilter = '' | 'CUSTOMER' | 'WHOLESALER';
type StatusFilter = '' | 'ACTIVE' | 'INACTIVE';

interface UsersFiltersProps {
  segment: UserSegment;
  search: string;
  roleFilter: CustomerRoleFilter;
  statusFilter: StatusFilter;
  onSearch: (value: string) => void;
  onRoleChange: (value: CustomerRoleFilter) => void;
  onStatusChange: (value: StatusFilter) => void;
}

const UsersFilters = ({ segment, search, roleFilter, statusFilter, onSearch, onRoleChange, onStatusChange }: UsersFiltersProps) => (
  <div className="card card-body mb-3">
    <div className="row g-3 align-items-end">
      <div className="col-12 col-lg">
        <label className="form-label" htmlFor="users-search">Buscar</label>
        <input id="users-search" className="form-control" type="search" placeholder="Nombre, email, empresa o CUIT/DNI"
          value={search} onChange={(event) => onSearch(event.target.value)} />
      </div>
      {segment === 'CLIENTS' && <div className="col-12 col-md-6 col-lg-3">
        <label className="form-label" htmlFor="users-role-filter">Rol</label>
        <select id="users-role-filter" className="form-select" value={roleFilter}
          onChange={(event) => onRoleChange(event.target.value as CustomerRoleFilter)}>
          <option value="">Todos los roles</option><option value="CUSTOMER">CUSTOMER</option><option value="WHOLESALER">WHOLESALER</option>
        </select>
      </div>}
      <div className="col-12 col-md-6 col-lg-3">
        <label className="form-label" htmlFor="users-status-filter">Estado</label>
        <select id="users-status-filter" className="form-select" value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value as StatusFilter)}>
          <option value="">Todos los estados</option><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option>
        </select>
      </div>
    </div>
  </div>
);

export default UsersFilters;
