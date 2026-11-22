import type { FormEvent } from 'react';
import { NUMERIC_SIZES, type AdminVariantResponse, type ColorResponse, type ProductOption } from '../../../types/products';

export interface VariantFormValues {
  productId: string;
  colorId: string;
  size: string;
  desc: string;
  sku: string;
  price: string;
  stock: string;
}

interface VariantFormModalProps {
  form: VariantFormValues;
  editForm: VariantFormValues;
  editingVariant: AdminVariantResponse | null;
  createOpen: boolean;
  saving: boolean;
  error: string;
  activeProducts: ProductOption[];
  activeColors: ColorResponse[];
  colors: ColorResponse[];
  onFormChange: (key: keyof VariantFormValues, value: string) => void;
  onEditFormChange: (key: keyof VariantFormValues, value: string) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCloseCreate: () => void;
  onCloseEdit: () => void;
}

const VariantFields = ({ value, onChange, edit = false, editingVariant, activeProducts, activeColors, colors }: {
  value: VariantFormValues;
  onChange: (key: keyof VariantFormValues, value: string) => void;
  edit?: boolean;
  editingVariant?: AdminVariantResponse | null;
  activeProducts: ProductOption[];
  activeColors: ColorResponse[];
  colors: ColorResponse[];
}) => {
  const prefix = edit ? 'edit-' : '';
  return <div className="row g-3">
    {!edit ? <div className="col-12 col-md-6">
      <label className="form-label" htmlFor="variant-product">Producto</label>
      <select id="variant-product" className="form-select" required value={value.productId} onChange={(event) => onChange('productId', event.target.value)}>
        <option value="">Seleccionar producto</option>
        {activeProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
      </select>
    </div> : <div className="col-12 col-md-6">
      <label className="form-label" htmlFor="edit-variant-product">Producto (solo lectura)</label>
      <input id="edit-variant-product" className="form-control" value={editingVariant?.productName ?? ''} readOnly />
    </div>}
    <div className="col-12 col-md-6">
      <label className="form-label" htmlFor={`${prefix}variant-color`}>Color</label>
      <select id={`${prefix}variant-color`} className="form-select" required value={value.colorId} onChange={(event) => onChange('colorId', event.target.value)}>
        {!edit && <option value="">Seleccionar color</option>}
        {edit && editingVariant && !activeColors.some((color) => color.id === editingVariant.colorId) && <option value={editingVariant.colorId}>
          {editingVariant.colorName}{colors.some((color) => color.id === editingVariant.colorId && color.rowStatus !== 'ACTIVE') ? ' (inactivo)' : ''}
        </option>}
        {activeColors.map((color) => <option key={color.id} value={color.id}>{color.name}</option>)}
      </select>
    </div>
    <div className="col-12 col-md-3">
      <label className="form-label" htmlFor={`${prefix}variant-size`}>Talle</label>
      <select id={`${prefix}variant-size`} className="form-select" required value={value.size} onChange={(event) => onChange('size', event.target.value)}>
        {!edit && <option value="">Seleccionar talle</option>}
        {NUMERIC_SIZES.map((size) => <option key={size} value={size}>{size.replace(/_/g, ' ').replace('T ', '')}</option>)}
      </select>
    </div>
    <div className="col-12 col-md-3">
      <label className="form-label" htmlFor={`${prefix}variant-sku`}>SKU</label>
      <input id={`${prefix}variant-sku`} className="form-control text-uppercase" required maxLength={100} value={value.sku} onChange={(event) => onChange('sku', event.target.value.toUpperCase())} />
    </div>
    <div className="col-12 col-md-3">
      <label className="form-label" htmlFor={`${prefix}variant-price`}>Precio</label>
      <input id={`${prefix}variant-price`} className="form-control" type="number" min="0" step="0.01" required value={value.price} onChange={(event) => onChange('price', event.target.value)} />
    </div>
    <div className="col-12 col-md-3">
      <label className="form-label" htmlFor={`${prefix}variant-stock`}>Stock</label>
      <input id={`${prefix}variant-stock`} className="form-control" type="number" min="0" step="1" required value={value.stock} onChange={(event) => onChange('stock', event.target.value)} />
    </div>
    <div className="col-12">
      <label className="form-label" htmlFor={`${prefix}variant-desc`}>Descripción</label>
      <input id={`${prefix}variant-desc`} className="form-control" required maxLength={255} value={value.desc} onChange={(event) => onChange('desc', event.target.value)} />
    </div>
  </div>;
};

const VariantFormModal = (props: VariantFormModalProps) => <>
  {props.createOpen && <form className="card card-body mb-4" onSubmit={props.onCreate}>
    <h2 className="h5">Alta de variante</h2>
    <VariantFields value={props.form} onChange={props.onFormChange} activeProducts={props.activeProducts} activeColors={props.activeColors} colors={props.colors} />
    <div className="mt-3"><button type="submit" className="btn btn-primary" disabled={props.saving || props.activeProducts.length === 0 || props.activeColors.length === 0} title="Crear variante" aria-label="Crear variante"><i className="bi bi-check-lg" aria-hidden="true" /></button></div>
  </form>}
  {props.editingVariant && <>
    <div className="modal-backdrop show" />
    <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="edit-variant-modal-title">
      <div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content position-relative">
        <div className="modal-header"><h2 className="modal-title h5" id="edit-variant-modal-title">Editar variante</h2></div>
        <form onSubmit={props.onSave}>
          <div className="modal-body">
            {props.error && <div className="alert alert-danger" role="alert">{props.error}</div>}
            <VariantFields value={props.editForm} onChange={props.onEditFormChange} edit editingVariant={props.editingVariant} activeProducts={props.activeProducts} activeColors={props.activeColors} colors={props.colors} />
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

export default VariantFormModal;
