import { useCallback, useEffect, useState, type FormEvent } from 'react';
import useAuth from '../../hooks/useAuth';
import { TARGET_GENDERS, isTargetGender, type TargetGender } from '../../constants/products';
import {
  createAdminProduct,
  getAdminProducts,
  updateAdminProduct,
  updateAdminProductStatus,
} from '../../services/adminCatalogService';
import type { AdminProductRequest, AdminProductResponse, PageResponse } from '../../types/products';

const PAGE_SIZE = 20;
const emptyForm: AdminProductRequest = { targetGender: 'UNISEX', name: '', shortDesc: '', longDesc: '' };
const emptyPage: PageResponse<AdminProductResponse> = { content: [], totalPages: 0 };

const AdminProducts = () => {
  const { role } = useAuth();
  const [pageData, setPageData] = useState(emptyPage);
  const [page, setPage] = useState(0);
  const [form, setForm] = useState<AdminProductRequest>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPageData(await getAdminProducts(page, PAGE_SIZE));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId === null) {
        await createAdminProduct(form);
        setPage(0);
        if (page === 0) await loadProducts();
      } else {
        const updated = await updateAdminProduct(editingId, form);
        setPageData((current) => ({
          ...current,
          content: current.content.map((product) => product.id === editingId ? updated : product),
        }));
      }
      resetForm();
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
      if (status === 'DELETED') {
        setPageData((current) => ({
          ...current,
          content: current.content.filter((item) => item.id !== product.id),
        }));
      } else {
        setPageData((current) => ({
          ...current,
          content: current.content.map((item) => item.id === product.id ? { ...item, status } : item),
        }));
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cambiar el estado del producto.');
    }
  };

  return (
    <section>
      <header className="mb-4">
        <h1 className="h2">Productos</h1>
        <p className="text-muted mb-0">Creá y mantené los productos del catálogo.</p>
      </header>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <form className="card card-body mb-4" onSubmit={(event) => void handleSubmit(event)}>
        <h2 className="h5">{editingId === null ? 'Crear producto' : 'Editar producto'}</h2>
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
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : editingId === null ? 'Crear producto' : 'Guardar cambios'}
          </button>
          {editingId !== null && <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancelar</button>}
        </div>
      </form>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead><tr><th>Nombre</th><th>Género objetivo</th><th>Descripción corta</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-4 text-center">Cargando productos…</td></tr>
              ) : pageData.content.length === 0 ? (
                <tr><td colSpan={5} className="py-4 text-center">No hay productos para mostrar.</td></tr>
              ) : pageData.content.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{TARGET_GENDERS.find((gender) => gender.value === product.targetGender)?.label ?? product.targetGender}</td>
                  <td>{product.shortDesc}</td>
                  <td><span className={`badge ${product.status === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>{product.status}</span></td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          setForm({
                            targetGender: product.targetGender,
                            name: product.name,
                            shortDesc: product.shortDesc,
                            longDesc: product.longDesc,
                          });
                          setEditingId(product.id);
                        }}
                      >
                        Editar
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void handleStatus(product)}>
                        {product.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                      </button>
                      {role === 'ADMIN' && (
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void handleStatus(product, true)}>
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
