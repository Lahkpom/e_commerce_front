import { TARGET_GENDERS, isTargetGender } from '../../../constants/products';
import type { AdminProductSearchFilters } from '../../../types/products';

interface ProductFiltersProps {
  filters: AdminProductSearchFilters;
  onChange: (key: 'targetGender' | 'rowStatus' | 'search', value: string) => void;
}

const ProductFilters = ({ filters, onChange }: ProductFiltersProps) => (
  <div className="card card-body mb-3">
    <div className="row g-3">
      <div className="col-12 col-md-4">
        <label className="form-label" htmlFor="filter-product-gender">Género objetivo</label>
        <select id="filter-product-gender" className="form-select" value={filters.targetGender ?? ''}
          onChange={(event) => onChange('targetGender', isTargetGender(event.target.value) ? event.target.value : '')}>
          <option value="">Todos</option>
          {TARGET_GENDERS.map((gender) => <option key={gender.value} value={gender.value}>{gender.label}</option>)}
        </select>
      </div>
      <div className="col-12 col-md-3">
        <label className="form-label" htmlFor="filter-product-status">Estado</label>
        <select id="filter-product-status" className="form-select" value={filters.rowStatus ?? ''}
          onChange={(event) => onChange('rowStatus', event.target.value === 'ACTIVE' || event.target.value === 'INACTIVE' ? event.target.value : '')}>
          <option value="">Todos</option><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option>
        </select>
      </div>
      <div className="col-12 col-md-5">
        <label className="form-label" htmlFor="filter-product-search">Buscar</label>
        <input id="filter-product-search" className="form-control" type="search" placeholder="Buscar por nombre o descripción"
          value={filters.search ?? ''} onChange={(event) => onChange('search', event.target.value)} />
      </div>
    </div>
  </div>
);

export default ProductFilters;
