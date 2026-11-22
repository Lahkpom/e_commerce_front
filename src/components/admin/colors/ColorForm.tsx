import type { FormEvent } from 'react';
import type { ColorRequest } from '../../../types/products';

interface ColorFormProps {
  form: ColorRequest;
  editing: boolean;
  saving: boolean;
  onChange: (form: ColorRequest) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}

const HEX_COLOR_PATTERN = /^#[\da-f]{6}$/i;

const ColorForm = ({ form, editing, saving, onChange, onSubmit, onReset }: ColorFormProps) => (
  <form className="card card-body mb-4" onSubmit={onSubmit}>
    <h2 className="h5">{editing ? 'Editar color' : 'Crear color'}</h2>
    <div className="row g-3">
      <div className="col-12 col-md-4">
        <label className="form-label" htmlFor="color-name">Nombre</label>
        <input id="color-name" className="form-control" maxLength={50} required value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })} />
      </div>
      <div className="col-12 col-md-5">
        <label className="form-label" htmlFor="color-desc">Descripción</label>
        <input id="color-desc" className="form-control" maxLength={2000} required value={form.desc}
          onChange={(event) => onChange({ ...form, desc: event.target.value })} />
      </div>
      <div className="col-12 col-md-3">
        <label className="form-label" htmlFor="color-code">Código HEX</label>
        <div className="input-group">
          <input aria-label="Selector visual de color" className="form-control form-control-color" type="color"
            value={HEX_COLOR_PATTERN.test(form.code) ? form.code : '#000000'}
            onChange={(event) => onChange({ ...form, code: event.target.value.toUpperCase() })} />
          <input id="color-code" className="form-control" maxLength={7} pattern="#[\da-fA-F]{6}" required
            value={form.code} onChange={(event) => onChange({ ...form, code: event.target.value })} />
        </div>
      </div>
    </div>
    <div className="d-flex gap-2 mt-3">
      <button type="submit" className="btn btn-primary" disabled={saving}
        title={editing ? 'Guardar cambios' : 'Crear color'} aria-label={editing ? 'Guardar cambios' : 'Crear color'}>
        <i className="bi bi-check-lg" aria-hidden="true" />
      </button>
      {editing && <button type="button" className="btn btn-outline-secondary" title="Cerrar edición"
        aria-label="Cerrar edición" onClick={onReset}><i className="bi bi-x-lg" aria-hidden="true" /></button>}
    </div>
  </form>
);

export default ColorForm;
