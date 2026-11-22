import { useCallback, useEffect, useState, type FormEvent } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  createVariant,
  getActiveProductOptions,
  getAdminColors,
  searchAdminVariants,
  updateVariant,
  updateVariantStatus,
} from '../../services/adminCatalogService';
import {
  NUMERIC_SIZES,
  type AdminVariantResponse,
  type AdminVariantSearchFilters,
  type ColorResponse,
  type PageResponse,
  type ProductOption,
  type RowStatus,
  type VariantCreateRequest,
  type VariantUpdateRequest,
} from '../../types/products';

const emptyPage: PageResponse<AdminVariantResponse> = { content: [], totalPages: 0 };

interface VariantFormValues {
  productId: string;
  colorId: string;
  size: string;
  desc: string;
  sku: string;
  price: string;
  stock: string;
}

interface VariantFilters {
  productId: string;
  colorId: string;
  size: string;
  rowStatus: string;
  search: string;
}

const emptyForm: VariantFormValues = {
  productId: '',
  colorId: '',
  size: '',
  desc: '',
  sku: '',
  price: '',
  stock: '',
};

const emptyFilters: VariantFilters = {
  productId: '',
  colorId: '',
  size: '',
  rowStatus: '',
  search: '',
};

const toVariantForm = (variant: AdminVariantResponse): VariantFormValues => ({
  productId: variant.productId,
  colorId: String(variant.colorId),
  size: variant.size,
  desc: variant.desc,
  sku: variant.sku,
  price: String(variant.price),
  stock: String(variant.stock),
});

const isNumericSize = (value: string): value is (typeof NUMERIC_SIZES)[number] =>
  NUMERIC_SIZES.some((size) => size === value);

const isRowStatus = (value: string): value is Exclude<RowStatus, 'DELETED'> =>
  value === 'ACTIVE' || value === 'INACTIVE';

const toUpdatePayload = (form: VariantFormValues): VariantUpdateRequest | null => {
  const colorId = Number(form.colorId);
  const price = Number(form.price);
  const stock = Number(form.stock);
  if (!Number.isSafeInteger(colorId) || colorId <= 0 || !isNumericSize(form.size)) return null;
  if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(stock) || stock < 0) return null;
  return {
    colorId,
    size: form.size,
    desc: form.desc.trim(),
    sku: form.sku.trim().toUpperCase(),
    price,
    stock,
  };
};

const AdminVariants = () => {
  const { role } = useAuth();
  const [pageData, setPageData] = useState(emptyPage);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<VariantFilters>(emptyFilters);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [colors, setColors] = useState<ColorResponse[]>([]);
  const [form, setForm] = useState<VariantFormValues>(emptyForm);
  const [editForm, setEditForm] = useState<VariantFormValues>(emptyForm);
  const [editingVariant, setEditingVariant] = useState<AdminVariantResponse | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const activeColors = colors.filter((color) => color.rowStatus === 'ACTIVE');
  const activeProducts = products.filter((product) => product.rowStatus === 'ACTIVE');

  const loadVariants = useCallback(async () => {
    setLoading(true);
    setError('');
    const searchFilters: AdminVariantSearchFilters = { page };
    if (filters.productId) searchFilters.productId = filters.productId;
    if (filters.colorId) searchFilters.colorId = Number(filters.colorId);
    if (isNumericSize(filters.size)) searchFilters.size = filters.size;
    if (isRowStatus(filters.rowStatus)) searchFilters.rowStatus = filters.rowStatus;
    if (filters.search.trim()) searchFilters.search = filters.search.trim();
    try {
      const result = await searchAdminVariants(searchFilters);
      setPageData(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las variantes.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void loadVariants();
  }, [loadVariants]);

  useEffect(() => {
    const loadFormOptions = async () => {
      try {
        const [productOptions, colorOptions] = await Promise.all([
          getActiveProductOptions(),
          getAdminColors(),
        ]);
        setProducts(productOptions);
        setColors(colorOptions);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar productos y colores.');
      }
    };
    void loadFormOptions();
  }, []);

  const changeFilter = (key: keyof VariantFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
  };

  const changeForm = (key: keyof VariantFormValues, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const changeEditForm = (key: keyof VariantFormValues, value: string) => {
    setEditForm((current) => ({ ...current, [key]: value }));
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = toUpdatePayload(form);
    if (!payload || !form.productId) {
      setError('Completá todos los campos con valores válidos.');
      return;
    }
    const request: VariantCreateRequest = { ...payload, productId: form.productId };
    setSaving(true);
    setError('');
    try {
      await createVariant(request);
      setCreateOpen(false);
      setForm(emptyForm);
      setPage(0);
      if (page === 0) await loadVariants();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear la variante.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingVariant) return;
    const payload = toUpdatePayload(editForm);
    if (!payload) {
      setError('Completá todos los campos con valores válidos.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const updated = await updateVariant(editingVariant.id, payload);
      setPageData((current) => ({
        ...current,
        content: current.content.map((item) => item.id === updated.id ? updated : item),
      }));
      setEditingVariant(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar la variante.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (variant: AdminVariantResponse, deleting = false) => {
    if (deleting && !window.confirm(`¿Eliminar la variante ${variant.sku}?`)) return;
    const rowStatus: RowStatus = deleting
      ? 'DELETED'
      : variant.rowStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setError('');
    try {
      const updated = await updateVariantStatus(variant.id, rowStatus);
      setPageData((current) => ({
        ...current,
        content: rowStatus === 'DELETED'
          ? current.content.filter((item) => item.id !== variant.id)
          : current.content.map((item) => item.id === updated.id ? updated : item),
      }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cambiar el estado de la variante.');
    }
  };

  return (
    <section>
      <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1">Variantes</h1>
          <p className="text-muted mb-0">Filtrá y gestioná talles, colores, SKU, precios y stock.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          title={createOpen ? 'Cerrar formulario' : 'Crear variante'}
          aria-label={createOpen ? 'Cerrar formulario' : 'Crear variante'}
          onClick={() => setCreateOpen((open) => !open)}
        >
          <i className={`bi ${createOpen ? 'bi-x-lg' : 'bi-plus-lg'}`} aria-hidden="true" />
        </button>
      </header>

      {error && !editingVariant && <div className="alert alert-danger" role="alert">{error}</div>}

      {createOpen && (
        <form className="card card-body mb-4" onSubmit={(event) => void handleCreate(event)}>
          <h2 className="h5">Alta de variante</h2>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="variant-product">Producto</label>
              <select id="variant-product" className="form-select" required value={form.productId} onChange={(event) => changeForm('productId', event.target.value)}>
                <option value="">Seleccionar producto</option>
                {activeProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="variant-color">Color</label>
              <select id="variant-color" className="form-select" required value={form.colorId} onChange={(event) => changeForm('colorId', event.target.value)}>
                <option value="">Seleccionar color</option>
                {activeColors.map((color) => <option key={color.id} value={color.id}>{color.name}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label" htmlFor="variant-size">Talle</label>
              <select id="variant-size" className="form-select" required value={form.size} onChange={(event) => changeForm('size', event.target.value)}>
                <option value="">Seleccionar talle</option>
                {NUMERIC_SIZES.map((size) => <option key={size} value={size}>{size.replace(/_/g, ' ').replace('T ', '')}</option>)}
              </select>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label" htmlFor="variant-sku">SKU</label>
              <input id="variant-sku" className="form-control text-uppercase" required maxLength={100} value={form.sku} onChange={(event) => changeForm('sku', event.target.value.toUpperCase())} />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label" htmlFor="variant-price">Precio</label>
              <input id="variant-price" className="form-control" type="number" min="0" step="0.01" required value={form.price} onChange={(event) => changeForm('price', event.target.value)} />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label" htmlFor="variant-stock">Stock</label>
              <input id="variant-stock" className="form-control" type="number" min="0" step="1" required value={form.stock} onChange={(event) => changeForm('stock', event.target.value)} />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="variant-desc">Descripción</label>
              <input id="variant-desc" className="form-control" required value={form.desc} onChange={(event) => changeForm('desc', event.target.value)} />
            </div>
          </div>
          <div className="mt-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || activeProducts.length === 0 || activeColors.length === 0}
              title="Crear variante"
              aria-label="Crear variante"
            >
              <i className="bi bi-check-lg" aria-hidden="true" />
            </button>
          </div>
        </form>
      )}

      <div className="card card-body mb-3">
        <div className="row g-2">
          <div className="col-12 col-md">
            <label className="form-label" htmlFor="filter-product">Producto</label>
            <select id="filter-product" className="form-select" value={filters.productId} onChange={(event) => changeFilter('productId', event.target.value)}>
              <option value="">Todos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}{product.rowStatus === 'INACTIVE' ? ' (INACTIVE)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md">
            <label className="form-label" htmlFor="filter-color">Color</label>
            <select id="filter-color" className="form-select" value={filters.colorId} onChange={(event) => changeFilter('colorId', event.target.value)}>
              <option value="">Todos</option>
              {colors.map((color) => <option key={color.id} value={color.id}>{color.name}</option>)}
            </select>
          </div>
          <div className="col-12 col-md">
            <label className="form-label" htmlFor="filter-size">Talle</label>
            <select id="filter-size" className="form-select" value={filters.size} onChange={(event) => changeFilter('size', event.target.value)}>
              <option value="">Todos</option>
              {NUMERIC_SIZES.map((size) => <option key={size} value={size}>{size.replace(/_/g, ' ').replace('T ', '')}</option>)}
            </select>
          </div>
          <div className="col-12 col-md">
            <label className="form-label" htmlFor="filter-status">Estado</label>
            <select id="filter-status" className="form-select" value={filters.rowStatus} onChange={(event) => changeFilter('rowStatus', event.target.value)}>
              <option value="">Todos</option>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label" htmlFor="filter-search">Buscar SKU o texto</label>
            <input id="filter-search" className="form-control" value={filters.search} onChange={(event) => changeFilter('search', event.target.value)} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle mb-0">
            <thead>
              <tr><th>Producto</th><th>Color</th><th>Talle</th><th>SKU</th><th>Precio</th><th>Stock</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-4 text-center">Cargando variantes…</td></tr>
              ) : pageData.content.length === 0 ? (
                <tr><td colSpan={8} className="py-4 text-center">No hay variantes para mostrar.</td></tr>
              ) : pageData.content.map((variant) => {
                return (
                  <tr key={variant.id}>
                    <td>{variant.productName}</td>
                    <td>
                      <span className="d-inline-block rounded-circle border me-1 align-middle" aria-label={variant.colorCode} style={{ width: 18, height: 18, backgroundColor: variant.colorCode }} />
                      <span>{variant.colorName}</span>
                    </td>
                    <td>{variant.size.replace(/_/g, ' ').replace('T ', '')}</td>
                    <td>{variant.sku}</td>
                    <td>{variant.price}</td>
                    <td>{variant.stock}</td>
                    <td><span className={`badge ${variant.rowStatus === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>{variant.rowStatus}</span></td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          disabled={saving}
                          title="Editar variante"
                          aria-label="Editar variante"
                          onClick={() => {
                            setEditingVariant(variant);
                            setEditForm(toVariantForm(variant));
                          }}
                        >
                          <i className="bi bi-pencil" aria-hidden="true" />
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-secondary" title={`${variant.rowStatus === 'ACTIVE' ? 'Desactivar' : 'Activar'} ${variant.sku}`} aria-label={`${variant.rowStatus === 'ACTIVE' ? 'Desactivar' : 'Activar'} ${variant.sku}`} onClick={() => void handleStatus(variant)}>
                          <i className="bi bi-arrow-repeat" aria-hidden="true" />
                        </button>
                        {role === 'ADMIN' && (
                          <button type="button" className="btn btn-sm btn-outline-danger" title={`Eliminar ${variant.sku}`} aria-label={`Eliminar ${variant.sku}`} onClick={() => void handleStatus(variant, true)}>
                            <i className="bi bi-trash" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="d-flex justify-content-between align-items-center gap-2 p-3">
          <span className="text-muted">Página {page + 1} de {Math.max(pageData.totalPages, 1)}</span>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 0 || loading} onClick={() => setPage((current) => current - 1)}>Anterior</button>
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page + 1 >= pageData.totalPages || loading} onClick={() => setPage((current) => current + 1)}>Siguiente</button>
          </div>
        </div>
      </div>

      {editingVariant && (
        <>
          <div className="modal-backdrop show" />
          <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="edit-variant-modal-title">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content position-relative">
                <div className="modal-header">
                  <h2 className="modal-title h5" id="edit-variant-modal-title">Editar variante</h2>
                </div>
                <form onSubmit={(event) => void handleSave(event)}>
                  <div className="modal-body">
                    {error && <div className="alert alert-danger" role="alert">{error}</div>}
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <label className="form-label" htmlFor="edit-variant-product">Producto (solo lectura)</label>
                        <input id="edit-variant-product" className="form-control" value={editingVariant.productName} readOnly />
                      </div>
                      <div className="col-12 col-md-6">
                        <label className="form-label" htmlFor="edit-variant-color">Color</label>
                        <select
                          id="edit-variant-color"
                          className="form-select"
                          required
                          value={editForm.colorId}
                          onChange={(event) => changeEditForm('colorId', event.target.value)}
                        >
                          {!activeColors.some((color) => color.id === editingVariant.colorId) && (
                            <option value={editingVariant.colorId}>
                              {editingVariant.colorName}
                              {colors.some((color) => color.id === editingVariant.colorId && color.rowStatus !== 'ACTIVE') ? ' (inactivo)' : ''}
                            </option>
                          )}
                          {activeColors.map((color) => <option key={color.id} value={color.id}>{color.name}</option>)}
                        </select>
                      </div>
                      <div className="col-12 col-md-3">
                        <label className="form-label" htmlFor="edit-variant-size">Talle</label>
                        <select
                          id="edit-variant-size"
                          className="form-select"
                          required
                          value={editForm.size}
                          onChange={(event) => changeEditForm('size', event.target.value)}
                        >
                          {NUMERIC_SIZES.map((size) => <option key={size} value={size}>{size.replace(/_/g, ' ').replace('T ', '')}</option>)}
                        </select>
                      </div>
                      <div className="col-12 col-md-3">
                        <label className="form-label" htmlFor="edit-variant-sku">SKU</label>
                        <input
                          id="edit-variant-sku"
                          className="form-control text-uppercase"
                          required
                          maxLength={100}
                          value={editForm.sku}
                          onChange={(event) => changeEditForm('sku', event.target.value.toUpperCase())}
                        />
                      </div>
                      <div className="col-12 col-md-3">
                        <label className="form-label" htmlFor="edit-variant-price">Precio</label>
                        <input
                          id="edit-variant-price"
                          className="form-control"
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={editForm.price}
                          onChange={(event) => changeEditForm('price', event.target.value)}
                        />
                      </div>
                      <div className="col-12 col-md-3">
                        <label className="form-label" htmlFor="edit-variant-stock">Stock</label>
                        <input
                          id="edit-variant-stock"
                          className="form-control"
                          type="number"
                          min="0"
                          step="1"
                          required
                          value={editForm.stock}
                          onChange={(event) => changeEditForm('stock', event.target.value)}
                        />
                      </div>
                      <div className="col-12">
                        <label className="form-label" htmlFor="edit-variant-desc">Descripción</label>
                        <input
                          id="edit-variant-desc"
                          className="form-control"
                          required
                          maxLength={255}
                          value={editForm.desc}
                          onChange={(event) => changeEditForm('desc', event.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      title="Cancelar edición"
                      aria-label="Cancelar edición"
                      onClick={() => {
                        setEditingVariant(null);
                        setError('');
                      }}
                      disabled={saving}
                    >
                      <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                    <button type="submit" className="btn btn-primary" title="Guardar cambios" aria-label="Guardar cambios" disabled={saving}>
                      <i className="bi bi-check-lg" aria-hidden="true" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default AdminVariants;
