import { useCallback, useEffect, useState, type FormEvent } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  createColor,
  getAdminColors,
  updateColor,
  updateColorStatus,
} from '../../services/adminCatalogService';
import type { ColorRequest, ColorResponse } from '../../types/products';

const emptyForm: ColorRequest = { name: '', desc: '', code: '#000000' };
const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/i;

const AdminColors = () => {
  const { role } = useAuth();
  const [colors, setColors] = useState<ColorResponse[]>([]);
  const [form, setForm] = useState<ColorRequest>(emptyForm);
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

  useEffect(() => {
    void loadColors();
  }, [loadColors]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const saved = editingId === null
        ? await createColor(form)
        : await updateColor(editingId, form);
      setColors((current) => editingId === null
        ? [...current, saved].sort((a, b) => a.name.localeCompare(b.name))
        : current.map((color) => color.id === saved.id ? saved : color)
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
    const rowStatus = deleting
      ? 'DELETED'
      : color.rowStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
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

      <form className="card card-body mb-4" onSubmit={(event) => void handleSubmit(event)}>
        <h2 className="h5">{editingId === null ? 'Crear color' : 'Editar color'}</h2>
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="form-label" htmlFor="color-name">Nombre</label>
            <input
              id="color-name"
              className="form-control"
              maxLength={50}
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </div>
          <div className="col-12 col-md-5">
            <label className="form-label" htmlFor="color-desc">Descripción</label>
            <input
              id="color-desc"
              className="form-control"
              maxLength={2000}
              required
              value={form.desc}
              onChange={(event) => setForm((current) => ({ ...current, desc: event.target.value }))}
            />
          </div>
          <div className="col-12 col-md-3">
            <label className="form-label" htmlFor="color-code">Código HEX</label>
            <div className="input-group">
              <input
                aria-label="Selector visual de color"
                className="form-control form-control-color"
                type="color"
                value={HEX_COLOR_PATTERN.test(form.code) ? form.code : '#000000'}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
              />
              <input
                id="color-code"
                className="form-control"
                maxLength={7}
                pattern="#[\da-fA-F]{6}"
                required
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              />
            </div>
          </div>
        </div>
        <div className="d-flex gap-2 mt-3">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : editingId === null ? 'Crear color' : 'Guardar cambios'}
          </button>
          {editingId !== null && (
            <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr><th>Color</th><th>Nombre</th><th>Código</th><th>Descripción</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-4 text-center">Cargando colores…</td></tr>
              ) : colors.length === 0 ? (
                <tr><td colSpan={6} className="py-4 text-center">No hay colores para mostrar.</td></tr>
              ) : colors.map((color) => (
                <tr key={color.id}>
                  <td><span className="d-inline-block rounded-circle border" aria-label={color.code} style={{ width: 28, height: 28, backgroundColor: color.code }} /></td>
                  <td>{color.name}</td>
                  <td><code>{color.code}</code></td>
                  <td>{color.desc}</td>
                  <td><span className={`badge ${color.rowStatus === 'ACTIVE' ? 'text-bg-success' : 'text-bg-secondary'}`}>{color.rowStatus}</span></td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => {
                          setForm({ name: color.name, desc: color.desc, code: color.code });
                          setEditingId(color.id);
                        }}
                      >
                        Editar
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void handleStatus(color)}>
                        {color.rowStatus === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                      </button>
                      {role === 'ADMIN' && (
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => void handleStatus(color, true)}>
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
      </div>
    </section>
  );
};

export default AdminColors;
