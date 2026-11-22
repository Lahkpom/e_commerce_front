import { useCallback, useEffect, useState, type FormEvent } from 'react';
import useAuth from '../../../hooks/useAuth';
import { createColor, getAdminColors, updateColor, updateColorStatus } from '../../../services/adminCatalogService';
import type { ColorRequest, ColorResponse } from '../../../types/products';
import ColorForm from './ColorForm';
import ColorsTable from './ColorsTable';
import './AdminColors.scss';

const EMPTY_FORM: ColorRequest = { name: '', desc: '', code: '#000000' };

const AdminColorsManager = () => {
  const { role } = useAuth();
  const [colors, setColors] = useState<ColorResponse[]>([]);
  const [form, setForm] = useState<ColorRequest>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadColors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setColors(await getAdminColors());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los colores.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadColors(); }, [loadColors]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const saved = editingId === null ? await createColor(form) : await updateColor(editingId, form);
      setColors((current) => (editingId === null
        ? [...current, saved]
        : current.map((color) => color.id === saved.id ? saved : color))
        .sort((a, b) => a.name.localeCompare(b.name)));
      resetForm();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo guardar el color.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (color: ColorResponse, deleting = false) => {
    if (deleting && !window.confirm(`¿Eliminar el color ${color.name}?`)) return;
    const rowStatus = deleting ? 'DELETED' : color.rowStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setError('');
    try {
      const updated = await updateColorStatus(color.id, rowStatus);
      setColors((current) => rowStatus === 'DELETED'
        ? current.filter((item) => item.id !== color.id)
        : current.map((item) => item.id === color.id ? updated : item));
      if (editingId === color.id && rowStatus === 'DELETED') resetForm();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cambiar el estado del color.');
    }
  };

  return (
    <section>
      <header className="mb-4">
        <h1 className="h2">Colores</h1>
        <p className="text-muted mb-0">Administrá los colores disponibles para las variantes.</p>
      </header>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <ColorForm form={form} editing={editingId !== null} saving={saving} onChange={setForm}
        onSubmit={(event) => void handleSubmit(event)} onReset={resetForm} />
      <ColorsTable colors={colors} loading={loading} canDelete={role === 'ADMIN'}
        onEdit={(color) => { setForm({ name: color.name, desc: color.desc, code: color.code }); setEditingId(color.id); }}
        onStatus={(color, deleting) => void handleStatus(color, deleting)} />
    </section>
  );
};

export default AdminColorsManager;
