import { useCallback, useEffect, useState, type FormEvent } from 'react';
import useAuth from '../../../hooks/useAuth';
import type { AdminProductRequest, AdminProductResponse, AdminProductSearchFilters, PageResponse, RowStatus } from '../../../types/products';
import { createAdminProduct, searchAdminProducts, updateAdminProduct, updateAdminProductStatus } from '../../../services/adminCatalogService';
import ProductFilters from './ProductFilters';
import ProductsTable from './ProductsTable';
import ProductFormModal from './ProductFormModal';
import './AdminProducts.scss';

const PAGE_SIZE = 20;
const emptyForm: AdminProductRequest = { targetGender: 'UNISEX', name: '', shortDesc: '', longDesc: '' };
const emptyPage: PageResponse<AdminProductResponse> = { content: [], totalPages: 0 };

const AdminProductsManager = () => {
  const { role } = useAuth();
  const [pageData, setPageData] = useState(emptyPage);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<AdminProductSearchFilters>({ page, size: PAGE_SIZE });
  const [form, setForm] = useState<AdminProductRequest>(emptyForm);
  const [editForm, setEditForm] = useState<AdminProductRequest>(emptyForm);
  const [editingProduct, setEditingProduct] = useState<AdminProductResponse | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPageData(await searchAdminProducts({ ...filters, page, size: PAGE_SIZE }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los productos.');
    } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const changeFilter = (key: 'targetGender' | 'rowStatus' | 'search', value: string) => {
    setFilters((current) => ({ ...current, [key]: value || undefined }));
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
    } finally { setSaving(false); }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateAdminProduct(editingProduct.id, editForm);
      setPageData((current) => ({ ...current, content: current.content.map((product) => product.id === updated.id ? updated : product) }));
      setEditingProduct(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar el producto.');
    } finally { setSaving(false); }
  };

  const handleStatus = async (product: AdminProductResponse, deleting = false) => {
    if (deleting && !window.confirm(`¿Eliminar el producto ${product.name}?`)) return;
    const status: RowStatus = deleting ? 'DELETED' : product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setError('');
    try {
      await updateAdminProductStatus(product.id, status);
      await loadProducts();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cambiar el estado del producto.');
    }
  };

  const editProduct = (product: AdminProductResponse) => {
    setEditingProduct(product);
    setEditForm({ targetGender: product.targetGender, name: product.name, shortDesc: product.shortDesc, longDesc: product.longDesc });
  };

  return <section className="admin-products">
    <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div><h1 className="h2 mb-1">Productos</h1><p className="text-muted mb-0">Creá y mantené los productos del catálogo.</p></div>
      <button type="button" className="btn btn-primary" title={createOpen ? 'Cerrar formulario' : 'Crear producto'} aria-label={createOpen ? 'Cerrar formulario' : 'Crear producto'} onClick={() => setCreateOpen((open) => !open)}>
        <i className={`bi ${createOpen ? 'bi-x-lg' : 'bi-plus-lg'}`} aria-hidden="true" />
      </button>
    </header>
    {error && !editingProduct && <div className="alert alert-danger" role="alert">{error}</div>}
    <ProductFormModal form={form} editForm={editForm} editingProduct={editingProduct} createOpen={createOpen} saving={saving} error={error}
      onFormChange={setForm} onEditFormChange={setEditForm} onCreate={handleCreate} onSave={handleSave}
      onCloseCreate={() => { setCreateOpen(false); setForm(emptyForm); }} onCloseEdit={() => { setEditingProduct(null); setError(''); }} />
    <ProductFilters filters={filters} onChange={changeFilter} />
    <ProductsTable pageData={pageData} page={page} loading={loading} saving={saving} role={role}
      onPageChange={setPage} onEdit={editProduct} onStatus={(product, deleting) => void handleStatus(product, deleting)} />
  </section>;
};

export default AdminProductsManager;
