import type { FormEvent } from 'react';
import { TARGET_GENDERS, isTargetGender, type TargetGender } from '../../../constants/products';
import type { AdminProductRequest, AdminProductResponse } from '../../../types/products';

interface ProductFormModalProps {
  form: AdminProductRequest;
  editForm: AdminProductRequest;
  editingProduct: AdminProductResponse | null;
  createOpen: boolean;
  saving: boolean;
  error: string;
  onFormChange: (form: AdminProductRequest) => void;
  onEditFormChange: (form: AdminProductRequest) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCloseCreate: () => void;
  onCloseEdit: () => void;
}

const ProductFields = ({ value, onChange, edit = false }: { value: AdminProductRequest; onChange: (value: AdminProductRequest) => void; edit?: boolean }) => {
  const prefix = edit ? 'edit-' : '';
  return <div className="row g-3">
    <div className="col-12 col-md-6">
      <label className="form-label" htmlFor={`${prefix}product-name`}>Nombre</label>
      <input id={`${prefix}product-name`} className="form-control" maxLength={255} required value={value.name}
        onChange={(event) => onChange({ ...value, name: event.target.value })} />
    </div>
    <div className="col-12 col-md-6">
      <label className="form-label" htmlFor={`${prefix}product-gender`}>Género objetivo</label>
      <select id={`${prefix}product-gender`} className="form-select" value={value.targetGender}
        onChange={(event) => { if (isTargetGender(event.target.value)) onChange({ ...value, targetGender: event.target.value as TargetGender }); }}>
        {TARGET_GENDERS.map((gender) => <option key={gender.value} value={gender.value}>{gender.label}</option>)}
      </select>
    </div>
    <div className="col-12">
      <label className="form-label" htmlFor={`${prefix}product-short-desc`}>Descripción corta</label>
      <input id={`${prefix}product-short-desc`} className="form-control" maxLength={255} required value={value.shortDesc}
        onChange={(event) => onChange({ ...value, shortDesc: event.target.value })} />
    </div>
    <div className="col-12">
      <label className="form-label" htmlFor={`${prefix}product-long-desc`}>Descripción larga</label>
      <textarea id={`${prefix}product-long-desc`} className="form-control" rows={edit ? 4 : 3} maxLength={5000} required value={value.longDesc}
        onChange={(event) => onChange({ ...value, longDesc: event.target.value })} />
    </div>
  </div>;
};

const ProductFormModal = (props: ProductFormModalProps) => <>
  {props.createOpen && <form className="card card-body mb-4" onSubmit={props.onCreate}>
    <h2 className="h5">Crear producto</h2>
    <ProductFields value={props.form} onChange={props.onFormChange} />
    <div className="d-flex gap-2 mt-3">
      <button type="submit" className="btn btn-primary" disabled={props.saving} title="Crear producto" aria-label="Crear producto"><i className="bi bi-check-lg" aria-hidden="true" /></button>
      <button type="button" className="btn btn-outline-secondary" title="Cerrar formulario" aria-label="Cerrar formulario" onClick={props.onCloseCreate}><i className="bi bi-x-lg" aria-hidden="true" /></button>
    </div>
  </form>}
  {props.editingProduct && <>
    <div className="modal-backdrop show" />
    <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="edit-product-modal-title">
      <div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content position-relative">
        <div className="modal-header"><h2 className="modal-title h5" id="edit-product-modal-title">Editar producto</h2></div>
        <form onSubmit={props.onSave}>
          <div className="modal-body">
            {props.error && <div className="alert alert-danger" role="alert">{props.error}</div>}
            <ProductFields value={props.editForm} onChange={props.onEditFormChange} edit />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" title="Cancelar edición" aria-label="Cancelar edición" onClick={props.onCloseEdit} disabled={props.saving}><i className="bi bi-x-lg" aria-hidden="true" /></button>
            <button type="submit" className="btn btn-primary" title="Guardar cambios" aria-label="Guardar cambios" disabled={props.saving}><i className="bi bi-check-lg" aria-hidden="true" /></button>
          </div>
        </form>
      </div></div>
    </div>
  </>}
</>;

export default ProductFormModal;
