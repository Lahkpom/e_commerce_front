import { useCallback, useEffect, useState, type FormEvent } from 'react';
import useAuth from '../../hooks/useAuth';
import { TARGET_GENDERS, isTargetGender, type TargetGender } from '../../constants/products';
import {
  createAdminProduct,
  searchAdminProducts,
  updateAdminProduct,
  updateAdminProductStatus,
} from '../../services/adminCatalogService';
import type {
  AdminProductRequest,
  AdminProductResponse,
  AdminProductSearchFilters,
  PageResponse,
  RowStatus,
} from '../../types/products';

const PAGE_SIZE = 20;
const emptyForm: AdminProductRequest = { targetGender: 'UNISEX', name: '', shortDesc: '', longDesc: '' };
const emptyPage: PageResponse<AdminProductResponse> = { content: [], totalPages: 0 };

const isRowStatus = (value: string): value is Exclude<RowStatus, 'DELETED'> =>
  value === 'ACTIVE' || value === 'INACTIVE';

const AdminProducts = () => {
  const { role } = useAuth();
  const [pageData, setPageData] = useState(emptyPage);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<AdminProductSearchFilters>({ page, size: PAGE_SIZE });
  const [drafts, setDrafts] = useState<Record<string, AdminProductRequest>>({});
  const [form, setForm] = useState<AdminProductRequest>(emptyForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await searchAdminProducts({ ...filters, page, size: PAGE_SIZE });
      setPageData(result);
      setDrafts(Object.fromEntries(result.content.map((product) => [product.id, {
        targetGender: product.targetGender,
        name: product.name,
        shortDesc: product.shortDesc,
        longDesc: product.longDesc,
      }])));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const changeFilter = (key: 'targetGender' | 'rowStatus' | 'search', value: string) => {
    setFilters((current) => ({
      ...current,
      [key]: value || undefined,
    }));
    setPage(0);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await createAdminProduct(form);
      setForm(emptyForm);
      setCreateOpen(false);
      setPage(0);
      if (page === 0) await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear el producto.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (product: AdminProductResponse) => {
    const draft = drafts[product.id];
    if (!draft) return;
    setSaving(true);
    setError('');
    try {
      await updateAdminProduct(product.id, draft);
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (product: AdminProductResponse, deleting = false) => {
    if (deleting && !window.confirm(`¿Eliminar el producto ${product.name}?`)) return;
    const status = deleting ? 'DELETED' : product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setError('');
    try {
      await updateAdminProductStatus(product.id, status);
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cambiar el estado del producto.');
    }
  };

  return (
    <section>
      <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1">Productos</h1>
          <p className="text-muted mb-0">Creá y mantené los productos del catálogo.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          title={createOpen ? 'Cerrar formulario' : 'Crear producto'}
          aria-label={createOpen ? 'Cerrar formulario' : 'Crear producto'}
          onClick={() => setCreateOpen((open) => !open)}
        >
          <i className={`bi ${createOpen ? 'bi-x-lg' : 'bi-plus-lg'}`} aria-hidden="true" />
        </button>
      </header>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      {createOpen && (
        <form className="card card-body mb-4" onSubmit={(event) => void handleCreate(event)}>
          <h2 className="h5">Crear producto</h2>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="product-name">Nombre</label>
              <input
                id="product-name"
                className="form-control"
                maxLength={255}
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="col-12 col-md-6">
              <label className="form-label" htmlFor="product-gender">Género objetivo</label>
              <select
                id="product-gender"
                className="form-select"
                value={form.targetGender}
                onChange={(event) => {
                  if (isTargetGender(event.target.value)) {
                    setForm((current) => ({ ...current, targetGender: event.target.value as TargetGender }));
                  }
                }}
              >
                {TARGET_GENDERS.map((gender) => <option key={gender.value} value={gender.value}>{gender.label}</option>)}
              </select>
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="product-short-desc">Descripción corta</label>
              <input
                id="product-short-desc"
                className="form-control"
                maxLength={255}
                required
                value={form.shortDesc}
                onChange={(event) => setForm((current) => ({ ...current, shortDesc: event.target.value }))}
              />
            </div>
            <div className="col-12">
              <label className="form-label" htmlFor="product-long-desc">Descripción larga</label>
              <textarea
                id="product-long-desc"
                className="form-control"
                rows={3}
                maxLength={5000}
                required
                value={form.longDesc}
                onChange={(event) => setForm((current) => ({ ...current, longDesc: event.target.value }))}
              />
            </div>
          </div>
          <div className="d-flex gap-2 mt-3">
            <button type="submit" className="btn btn-primary" disabled={saving} title="Crear producto" aria-label="Crear producto">
              <i className="bi bi-check-lg" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              title="Cerrar formulario"
              aria-label="Cerrar formulario"
              onClick={() => {
                setCreateOpen(false);
                setForm(emptyForm);
              }}
            >
              <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
          </div>
        </form>
      )}

      <div className="card card-body mb-3">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="form-label" htmlFor="filter-product-gender">Género objetivo</label>
            <select
              id="filter-product-gender"
              className="form-select"
              value={filters.targetGender ?? ''}
              onChange={(event) => changeFilter('targetGender', isTargetGender(event.target.value) ? event.target.value : '')}
            >
              <option value="">Todos</option>
              {TARGET_GENDERS.map((gender) => <option key={gender.value} value={gender.value}>{gender.label}</option>)}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label" htmlFor="filter-product-status">Estado</label>
            <select
              id="filter-product-status"
              className="form-select"
              value={filters.rowStatus ?? ''}
              onChange={(event) => changeFilter('rowStatus', isRowStatus(event.target.value) ? event.target.value : '')}
            >
              <option value="">Todos</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>
          <div className="col-12 col-md-5">
            <label className="form-label" htmlFor="filter-product-search">Buscar</label>
            <input
              id="filter-product-search"
              className="form-control"
              type="search"
              placeholder="Buscar por nombre o descripción"
              value={filters.search ?? ''}
              onChange={(event) => changeFilter('search', event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle mb-0">
            <thead>
              <tr><th>Nombre</th><th>Género objetivo</th><th>Descripción corta</th><th>Descripción larga</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-4 text-center">Cargando productos…</td></tr>
              ) : pageData.content.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-center">No hay productos para mostrar.</td></tr>
              ) : pageData.content.map((product) => {
                const draft = drafts[product.id] ?? {
                  targetGender: product.targetGender,
                  name: product.name,
                  shortDesc: product.shortDesc,
                  longDesc: product.longDesc,
                };
                const statusAction = product.status === 'ACTIVE' ? 'Desactivar' : 'Activar';
                return (
                  <tr key={product.id}>
                    <td>
                      <input
                        aria-label={`Nombre de ${product.name}`}
                        className="form-control form-control-sm"
                        maxLength={255}
                        value={draft.name}
                        onChange={(event) => setDrafts((current) => ({
                          ...current,
                          [product.id]: { ...draft, name: event.target.value },
                        }))}
                      />
                    </td>
                    <td>
                      <select
                        aria-label={`Género objetivo de ${product.name}`}
                        className="form-select form-select-sm"
                        value={draft.targetGender}
                        onChange={(event) => {
                          if (isTargetGender(event.target.value)) {
                            setDrafts((current) => ({
                              ...current,
                              [product.id]: { ...draft, targetGender: event.target.value as TargetGender },
                            }));
                          }
                        }}
                      >
                        {TARGET_GENDERS.map((gender) => <option key={gender.value} value={gender.value}>{gender.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <input
                        aria-label={`Descripción corta de ${product.name}`}
                        className="form-control form-control-sm"
                        maxLength={255}
                        value={draft.shortDesc}
                        onChange={(event) => setDrafts((current) => ({
                          ...current,
                          [product.id]: { ...draft, shortDesc: event.target.value },
                        }))}
                      />
                    </td>
                    <td>
                      <textarea
                        aria-label={`Descripción larga de ${product.name}`}
                        className="form-control form-control-sm"
                        rows={2}
                        maxLength={5000}
                        value={draft.longDesc}
                        onChange={(event) => setDrafts((current) => ({
                          ...current,
                          [product.id]: { ...draft, longDesc: event.target.value },
                        }))}
                      />
                    </td>
                    <td><span className={`badge ${product.status === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>{product.status}</span></td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          disabled={saving}
                          title={`Guardar cambios de ${product.name}`}
                          aria-label={`Guardar cambios de ${product.name}`}
                          onClick={() => void handleSave(product)}
                        >
                          <i className="bi bi-check-lg" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          title={`${statusAction} ${product.name}`}
                          aria-label={`${statusAction} ${product.name}`}
                          onClick={() => void handleStatus(product)}
                        >
                          <i className="bi bi-arrow-repeat" aria-hidden="true" />
                        </button>
                        {role === 'ADMIN' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            title={`Eliminar ${product.name}`}
                            aria-label={`Eliminar ${product.name}`}
                            onClick={() => void handleStatus(product, true)}
                          >
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
    </section>
  );
};

export default AdminProducts;
