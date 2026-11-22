import { useCallback, useEffect, useState, type FormEvent } from 'react';
import useAuth from '../../../hooks/useAuth';
import { createVariant, getActiveProductOptions, getAdminColors, searchAdminVariants, updateVariant, updateVariantStatus } from '../../../services/adminCatalogService';
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
} from '../../../types/products';
import VariantFilters, { type VariantFilters as VariantFilterValues } from './VariantFilters';
import VariantsTable from './VariantsTable';
import VariantFormModal, { type VariantFormValues } from './VariantFormModal';
import './AdminVariants.scss';

const emptyPage: PageResponse<AdminVariantResponse> = { content: [], totalPages: 0 };
const emptyForm: VariantFormValues = { productId: '', colorId: '', size: '', desc: '', sku: '', price: '', stock: '' };
const emptyFilters: VariantFilterValues = { productId: '', colorId: '', size: '', rowStatus: '', search: '' };

const toVariantForm = (variant: AdminVariantResponse): VariantFormValues => ({
  productId: variant.productId, colorId: String(variant.colorId), size: variant.size, desc: variant.desc,
  sku: variant.sku, price: String(variant.price), stock: String(variant.stock),
});
const isNumericSize = (value: string): value is (typeof NUMERIC_SIZES)[number] => NUMERIC_SIZES.some((size) => size === value);
const isRowStatus = (value: string): value is Exclude<RowStatus, 'DELETED'> => value === 'ACTIVE' || value === 'INACTIVE';
const toUpdatePayload = (form: VariantFormValues): VariantUpdateRequest | null => {
  const colorId = Number(form.colorId);
  const price = Number(form.price);
  const stock = Number(form.stock);
  if (!Number.isSafeInteger(colorId) || colorId <= 0 || !isNumericSize(form.size)) return null;
  if (!Number.isFinite(price) || price < 0 || !Number.isSafeInteger(stock) || stock < 0) return null;
  return { colorId, size: form.size, desc: form.desc.trim(), sku: form.sku.trim().toUpperCase(), price, stock };
};

const AdminVariantsManager = () => {
  const { role } = useAuth();
  const [pageData, setPageData] = useState(emptyPage);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<VariantFilterValues>(emptyFilters);
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
    try { setPageData(await searchAdminVariants(searchFilters)); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las variantes.'); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { void loadVariants(); }, [loadVariants]);
  useEffect(() => {
    const loadFormOptions = async () => {
      try {
        const [productOptions, colorOptions] = await Promise.all([getActiveProductOptions(), getAdminColors()]);
        setProducts(productOptions);
        setColors(colorOptions);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar productos y colores.');
      }
    };
    void loadFormOptions();
  }, []);

  const changeFilter = (key: keyof VariantFilterValues, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
  };
  const changeForm = (target: VariantFormValues, setTarget: (value: VariantFormValues) => void, key: keyof VariantFormValues, value: string) => setTarget({ ...target, [key]: value });
  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = toUpdatePayload(form);
    if (!payload || !form.productId) { setError('Completá todos los campos con valores válidos.'); return; }
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
    } finally { setSaving(false); }
  };
  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingVariant) return;
    const payload = toUpdatePayload(editForm);
    if (!payload) { setError('Completá todos los campos con valores válidos.'); return; }
    setSaving(true);
    setError('');
    try {
      const updated = await updateVariant(editingVariant.id, payload);
      setPageData((current) => ({ ...current, content: current.content.map((item) => item.id === updated.id ? updated : item) }));
      setEditingVariant(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar la variante.');
    } finally { setSaving(false); }
  };
  const handleStatus = async (variant: AdminVariantResponse, deleting = false) => {
    if (deleting && !window.confirm(`¿Eliminar la variante ${variant.sku}?`)) return;
    const rowStatus: RowStatus = deleting ? 'DELETED' : variant.rowStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setError('');
    try {
      const updated = await updateVariantStatus(variant.id, rowStatus);
      setPageData((current) => ({ ...current, content: rowStatus === 'DELETED'
        ? current.content.filter((item) => item.id !== variant.id)
        : current.content.map((item) => item.id === updated.id ? updated : item) }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cambiar el estado de la variante.');
    }
  };

  return <section className="admin-variants">
    <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div><h1 className="h2 mb-1">Variantes</h1><p className="text-muted mb-0">Filtrá y gestioná talles, colores, SKU, precios y stock.</p></div>
      <button type="button" className="btn btn-primary" title={createOpen ? 'Cerrar formulario' : 'Crear variante'} aria-label={createOpen ? 'Cerrar formulario' : 'Crear variante'} onClick={() => setCreateOpen((open) => !open)}>
        <i className={`bi ${createOpen ? 'bi-x-lg' : 'bi-plus-lg'}`} aria-hidden="true" />
      </button>
    </header>
    {error && !editingVariant && <div className="alert alert-danger" role="alert">{error}</div>}
    <VariantFormModal form={form} editForm={editForm} editingVariant={editingVariant} createOpen={createOpen} saving={saving} error={error}
      activeProducts={activeProducts} activeColors={activeColors} colors={colors}
      onFormChange={(key, value) => changeForm(form, setForm, key, value)}
      onEditFormChange={(key, value) => changeForm(editForm, setEditForm, key, value)}
      onCreate={handleCreate} onSave={handleSave}
      onCloseCreate={() => { setCreateOpen(false); setForm(emptyForm); }}
      onCloseEdit={() => { setEditingVariant(null); setError(''); }} />
    <VariantFilters filters={filters} products={products} colors={colors} onChange={changeFilter} />
    <VariantsTable pageData={pageData} page={page} loading={loading} saving={saving} role={role} onPageChange={setPage}
      onEdit={(variant) => { setEditingVariant(variant); setEditForm(toVariantForm(variant)); }}
      onStatus={(variant, deleting) => void handleStatus(variant, deleting)} />
  </section>;
};

export default AdminVariantsManager;
