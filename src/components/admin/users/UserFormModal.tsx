import type { FormEvent } from 'react';
import type { TaxIdType, UserResponse } from '../../../types/auth';

type CustomerRole = 'CUSTOMER' | 'WHOLESALER';
type ModalMode = 'wholesaler' | 'operator' | 'edit';
interface WholesalerForm { name: string; email: string; phone: string; companyName: string; taxIdNumber: string }
interface OperatorForm { name: string; email: string; phone: string }
interface EditForm { userRole: CustomerRole; companyName: string; taxIdType: TaxIdType | ''; taxIdNumber: string }

interface UserFormModalProps {
  mode: ModalMode;
  saving: boolean;
  editingUser: UserResponse | null;
  wholesalerForm: WholesalerForm;
  operatorForm: OperatorForm;
  editForm: EditForm;
  onWholesalerChange: (form: WholesalerForm) => void;
  onOperatorChange: (form: OperatorForm) => void;
  onEditChange: (form: EditForm) => void;
  onClose: () => void;
  onCreateWholesaler: (event: FormEvent<HTMLFormElement>) => void;
  onCreateOperator: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
}

const INITIAL_PASSWORD = 'CALWILL_Y_FIORELLA';
const CUSTOMER_ROLES: CustomerRole[] = ['CUSTOMER', 'WHOLESALER'];

const UserFormModal = ({
  mode, saving, editingUser, wholesalerForm, operatorForm, editForm,
  onWholesalerChange, onOperatorChange, onEditChange, onClose,
  onCreateWholesaler, onCreateOperator, onUpdate,
}: UserFormModalProps) => (
  <>
    <div className="modal-backdrop show" />
    <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="admin-user-modal-title">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content position-relative">
          <div className="modal-header"><h2 className="modal-title h5" id="admin-user-modal-title">
            {mode === 'wholesaler' && 'Nuevo Mayorista (WHOLESALER)'}
            {mode === 'operator' && 'Nuevo Operador (OPERATOR)'}
            {mode === 'edit' && 'Editar Cliente'}
          </h2></div>
          {mode === 'wholesaler' && <form onSubmit={onCreateWholesaler}>
            <div className="modal-body">
              <div className="alert alert-info" role="note">La cuenta nace con la contraseña inicial <strong>{INITIAL_PASSWORD}</strong> y deberá cambiarse en el primer inicio de sesión.</div>
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label" htmlFor="wholesaler-name">Nombre</label><input id="wholesaler-name" className="form-control" maxLength={255} required value={wholesalerForm.name} onChange={(event) => onWholesalerChange({ ...wholesalerForm, name: event.target.value })} /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="wholesaler-email">Email</label><input id="wholesaler-email" type="email" className="form-control" maxLength={255} required value={wholesalerForm.email} onChange={(event) => onWholesalerChange({ ...wholesalerForm, email: event.target.value })} /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="wholesaler-phone">Teléfono</label><input id="wholesaler-phone" className="form-control" inputMode="numeric" pattern="\d{10}" title="Ingresá exactamente 10 dígitos." value={wholesalerForm.phone} onChange={(event) => onWholesalerChange({ ...wholesalerForm, phone: event.target.value })} /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="wholesaler-company">Razón Social</label><input id="wholesaler-company" className="form-control" maxLength={255} required value={wholesalerForm.companyName} onChange={(event) => onWholesalerChange({ ...wholesalerForm, companyName: event.target.value })} /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="wholesaler-tax-type">Tipo de documento</label><input id="wholesaler-tax-type" className="form-control" value="CUIT" readOnly /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="wholesaler-tax-number">CUIT</label><input id="wholesaler-tax-number" className="form-control" inputMode="numeric" pattern="\d{11}" minLength={11} maxLength={11} required value={wholesalerForm.taxIdNumber} onChange={(event) => onWholesalerChange({ ...wholesalerForm, taxIdNumber: event.target.value })} /></div>
              </div>
            </div>
            <ModalFooter saving={saving} close={onClose} submitLabel="Crear mayorista" />
          </form>}
          {mode === 'operator' && <form onSubmit={onCreateOperator}>
            <div className="modal-body">
              <div className="alert alert-info" role="note">La cuenta nace con la contraseña inicial <strong>{INITIAL_PASSWORD}</strong> y deberá cambiarse en el primer inicio de sesión.</div>
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label" htmlFor="operator-name">Nombre</label><input id="operator-name" className="form-control" maxLength={255} required value={operatorForm.name} onChange={(event) => onOperatorChange({ ...operatorForm, name: event.target.value })} /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="operator-email">Email</label><input id="operator-email" type="email" className="form-control" maxLength={255} required value={operatorForm.email} onChange={(event) => onOperatorChange({ ...operatorForm, email: event.target.value })} /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="operator-phone">Teléfono</label><input id="operator-phone" className="form-control" inputMode="numeric" pattern="\d{10}" title="Ingresá exactamente 10 dígitos." value={operatorForm.phone} onChange={(event) => onOperatorChange({ ...operatorForm, phone: event.target.value })} /></div>
              </div>
            </div>
            <ModalFooter saving={saving} close={onClose} submitLabel="Crear operador" />
          </form>}
          {mode === 'edit' && editingUser && <form onSubmit={onUpdate}>
            <div className="modal-body">
              <div className="row g-3 mb-3">
                <ReadOnlyField id="edit-user-name" label="Nombre (solo lectura)" value={editingUser.userName} />
                <ReadOnlyField id="edit-user-email" label="Email (solo lectura)" value={editingUser.userEmail} />
                <ReadOnlyField id="edit-user-phone" label="Teléfono (solo lectura)" value={editingUser.userPhone ?? ''} />
              </div>
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label" htmlFor="edit-user-role">Rol</label><select id="edit-user-role" className="form-select" value={editForm.userRole} onChange={(event) => onEditChange({ ...editForm, userRole: event.target.value as CustomerRole })}>{CUSTOMER_ROLES.map((customerRole) => <option key={customerRole} value={customerRole}>{customerRole}</option>)}</select></div>
                <div className="col-md-6"><label className="form-label" htmlFor="edit-company-name">Razón Social</label><input id="edit-company-name" className="form-control" maxLength={255} value={editForm.companyName} onChange={(event) => onEditChange({ ...editForm, companyName: event.target.value })} /></div>
                <div className="col-md-6"><label className="form-label" htmlFor="edit-tax-type">Tipo de documento</label><select id="edit-tax-type" className="form-select" value={editForm.taxIdType} required={editForm.userRole === 'WHOLESALER'} onChange={(event) => onEditChange({ ...editForm, taxIdType: event.target.value as TaxIdType | '' })}><option value="">Sin documento</option><option value="CUIT">CUIT</option><option value="CUIL">CUIL</option><option value="DNI">DNI</option><option value="PASAPORTE">PASAPORTE</option></select></div>
                <div className="col-md-6"><label className="form-label" htmlFor="edit-tax-number">Número de documento</label><input id="edit-tax-number" className="form-control" maxLength={20} inputMode={editForm.userRole === 'WHOLESALER' ? 'numeric' : undefined} pattern={editForm.userRole === 'WHOLESALER' ? '\\d{11}' : undefined} required={editForm.userRole === 'WHOLESALER'} value={editForm.taxIdNumber} onChange={(event) => onEditChange({ ...editForm, taxIdNumber: event.target.value })} />{editForm.userRole === 'WHOLESALER' && <small className="form-text">Ingresá un CUIT de 11 dígitos.</small>}</div>
              </div>
            </div>
            <ModalFooter saving={saving} close={onClose} submitLabel="Guardar cambios" />
          </form>}
        </div>
      </div>
    </div>
  </>
);

const ModalFooter = ({ saving, close, submitLabel }: { saving: boolean; close: () => void; submitLabel: string }) => (
  <div className="modal-footer">
    <button type="button" className="btn btn-outline-secondary" title="Cerrar formulario" aria-label="Cerrar formulario" onClick={close} disabled={saving}><i className="bi bi-x-lg" aria-hidden="true" /></button>
    <button type="submit" className="btn btn-primary" title={submitLabel} aria-label={submitLabel} disabled={saving}><i className="bi bi-check-lg" aria-hidden="true" /></button>
  </div>
);
const ReadOnlyField = ({ id, label, value }: { id: string; label: string; value: string }) => (
  <div className="col-md-4"><label className="form-label" htmlFor={id}>{label}</label><input id={id} className="form-control" value={value} readOnly /></div>
);

export default UserFormModal;
