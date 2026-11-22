import { NUMERIC_SIZES, type ColorResponse, type ProductOption } from '../../../types/products';

export interface VariantFilters {
  productId: string;
  colorId: string;
  size: string;
  rowStatus: string;
  search: string;
}

interface VariantFiltersProps {
  filters: VariantFilters;
  products: ProductOption[];
  colors: ColorResponse[];
  onChange: (key: keyof VariantFilters, value: string) => void;
}

const VariantFilters = ({ filters, products, colors, onChange }: VariantFiltersProps) => (
  <div className="card card-body mb-3">
    <div className="row g-2">
      <div className="col-12 col-md">
        <label className="form-label" htmlFor="filter-product">Producto</label>
        <select id="filter-product" className="form-select" value={filters.productId} onChange={(event) => onChange('productId', event.target.value)}>
          <option value="">Todos</option>
          {products.map((product) => <option key={product.id} value={product.id}>{product.name}{product.rowStatus === 'INACTIVE' ? ' (INACTIVE)' : ''}</option>)}
        </select>
      </div>
      <div className="col-12 col-md">
        <label className="form-label" htmlFor="filter-color">Color</label>
        <select id="filter-color" className="form-select" value={filters.colorId} onChange={(event) => onChange('colorId', event.target.value)}>
          <option value="">Todos</option>{colors.map((color) => <option key={color.id} value={color.id}>{color.name}</option>)}
        </select>
      </div>
      <div className="col-12 col-md">
        <label className="form-label" htmlFor="filter-size">Talle</label>
        <select id="filter-size" className="form-select" value={filters.size} onChange={(event) => onChange('size', event.target.value)}>
          <option value="">Todos</option>{NUMERIC_SIZES.map((size) => <option key={size} value={size}>{size.replace(/_/g, ' ').replace('T ', '')}</option>)}
        </select>
      </div>
      <div className="col-12 col-md">
        <label className="form-label" htmlFor="filter-status">Estado</label>
        <select id="filter-status" className="form-select" value={filters.rowStatus} onChange={(event) => onChange('rowStatus', event.target.value)}>
          <option value="">Todos</option><option value="ACTIVE">Activo</option><option value="INACTIVE">Inactivo</option>
        </select>
      </div>
      <div className="col-12 col-md-3">
        <label className="form-label" htmlFor="filter-search">Buscar SKU o texto</label>
        <input id="filter-search" className="form-control" value={filters.search} onChange={(event) => onChange('search', event.target.value)} />
      </div>
    </div>
  </div>
);

export default VariantFilters;
