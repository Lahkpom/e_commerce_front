import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  createOperatorAccount,
  createWholesalerAccount,
  searchAdminUsers,
  updateAdminUser,
  updateAdminUserStatus,
  type AdminUserSearchParams,
} from '../../../services/adminUserService';
import type {
  AdminUserUpdateRequest,
  OperatorCreateRequest,
  TaxIdType,
  UserResponse,
  UserRole,
  UserSegment,
  WholesalerCreateRequest,
} from '../../../types/auth';
import type { PageResponse } from '../../../types/products';
import useAuth from '../../../hooks/useAuth';
import UsersFilters from './UsersFilters';
import UsersTable from './UsersTable';
import UserFormModal from './UserFormModal';
import './AdminUsers.scss';

const PAGE_SIZE = 20;
const INITIAL_PASSWORD = 'CALWILL_Y_FIORELLA';
type CustomerRole = 'CUSTOMER' | 'WHOLESALER';
const CUSTOMER_ROLES: CustomerRole[] = ['CUSTOMER', 'WHOLESALER'];
type CustomerRoleFilter = CustomerRole | '';
type ModalMode = 'wholesaler' | 'operator' | 'edit' | null;
type StatusFilter = '' | 'ACTIVE' | 'INACTIVE';

interface WholesalerForm {
  name: string;
  email: string;
  phone: string;
  companyName: string;
  taxIdNumber: string;
}

interface OperatorForm {
  name: string;
  email: string;
  phone: string;
}

interface EditForm {
  userRole: CustomerRole;
  companyName: string;
  taxIdType: TaxIdType | '';
  taxIdNumber: string;
}

const emptyPage: PageResponse<UserResponse> = {
  content: [],
  page: {
    size: PAGE_SIZE,
    number: 0,
    totalElements: 0,
    totalPages: 0,
  },
};

const emptyWholesalerForm: WholesalerForm = {
  name: '',
  email: '',
  phone: '',
  companyName: '',
  taxIdNumber: '',
};

const emptyOperatorForm: OperatorForm = { name: '', email: '', phone: '' };
const emptyEditForm: EditForm = {
  userRole: 'CUSTOMER',
  companyName: '',
  taxIdType: '',
  taxIdNumber: '',
};

const isCustomerRole = (role: UserRole): role is CustomerRole =>
  role === 'CUSTOMER' || role === 'WHOLESALER';

const AdminUsersManager = () => {
  const { role } = useAuth();
  const [segment, setSegment] = useState<UserSegment>('CLIENTS');
  const [roleFilter, setRoleFilter] = useState<CustomerRoleFilter>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageData, setPageData] = useState(emptyPage);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [wholesalerForm, setWholesalerForm] = useState(emptyWholesalerForm);
  const [operatorForm, setOperatorForm] = useState(emptyOperatorForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);

  const activeSegment: UserSegment = role === 'ADMIN' ? segment : 'CLIENTS';

  useEffect(() => {
    if (role !== 'ADMIN') setSegment('CLIENTS');
  }, [role]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    const params: AdminUserSearchParams = {
      segment: activeSegment,
      page,
      size: PAGE_SIZE,
    };
    if (activeSegment === 'OPERATORS') {
      params.roleFilter = 'OPERATOR';
    } else if (roleFilter) {
      params.roleFilter = roleFilter;
    }
    if (statusFilter) params.rowStatus = statusFilter;
    if (debouncedSearch) params.search = debouncedSearch;

    try {
      setPageData(await searchAdminUsers(params));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, [activeSegment, debouncedSearch, page, roleFilter, statusFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const changeSegment = (nextSegment: UserSegment) => {
    setSegment(nextSegment);
    setRoleFilter('');
    setPage(0);
  };

  const closeModal = () => {
    if (saving) return;
    setModalMode(null);
    setEditingUser(null);
    setError('');
  };

  const handleCreateWholesaler = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!/^\d{11}$/.test(wholesalerForm.taxIdNumber)) {
      setError('El CUIT debe contener exactamente 11 dígitos.');
      return;
    }

    const payload: WholesalerCreateRequest = {
      name: wholesalerForm.name.trim(),
      email: wholesalerForm.email.trim(),
      companyName: wholesalerForm.companyName.trim(),
      taxIdType: 'CUIT',
      taxIdNumber: wholesalerForm.taxIdNumber.trim(),
    };
    if (wholesalerForm.phone.trim()) payload.phone = wholesalerForm.phone.trim();

    setSaving(true);
    try {
      await createWholesalerAccount(payload);
      setWholesalerForm(emptyWholesalerForm);
      setModalMode(null);
      setPage(0);
      if (page === 0) await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear el mayorista.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateOperator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const payload: OperatorCreateRequest = {
      name: operatorForm.name.trim(),
      email: operatorForm.email.trim(),
    };
    if (operatorForm.phone.trim()) payload.phone = operatorForm.phone.trim();

    setSaving(true);
    try {
      await createOperatorAccount(payload);
      setOperatorForm(emptyOperatorForm);
      setModalMode(null);
      setPage(0);
      if (page === 0) await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear el operador.');
    } finally {
      setSaving(false);
    }
  };

  const openEditModal = (user: UserResponse) => {
    if (!isCustomerRole(user.userRole)) return;
    setEditingUser(user);
    setEditForm({
      userRole: user.userRole,
      companyName: user.companyName ?? '',
      taxIdType: user.taxIdType ?? '',
      taxIdNumber: user.taxIdNumber ?? '',
    });
    setError('');
    setModalMode('edit');
  };

  const handleUpdateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUser) return;
    setError('');
    const taxIdNumber = editForm.taxIdNumber.trim();
    const taxIdType = editForm.taxIdType || null;

    if (editForm.userRole === 'WHOLESALER'
      && (taxIdType !== 'CUIT' || !/^\d{11}$/.test(taxIdNumber))) {
      setError('Para un mayorista se requiere CUIT y un número de 11 dígitos.');
      return;
    }

    const payload: AdminUserUpdateRequest = {
      userRole: editForm.userRole,
      companyName: editForm.companyName.trim() || null,
      taxIdType,
      taxIdNumber: taxIdNumber || null,
    };

    setSaving(true);
    try {
      await updateAdminUser(editingUser.userId, payload);
      setModalMode(null);
      setEditingUser(null);
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (user: UserResponse, deleting = false) => {
    if (deleting) {
      const confirmation = window.prompt(
        `La eliminación es lógica y no se puede deshacer. Escribí ELIMINAR para borrar la cuenta de ${user.userEmail}.`,
      );
      if (confirmation !== 'ELIMINAR') return;
    }

    const nextStatus = deleting
      ? 'DELETED'
      : user.rowStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setError('');
    setSaving(true);
    try {
      await updateAdminUserStatus(user.userId, nextStatus);
      await loadUsers();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo cambiar el estado del usuario.');
    } finally {
      setSaving(false);
    }
  };

  const title = activeSegment === 'OPERATORS' ? 'Equipo Interno' : 'Clientes';

  return (
    <section>
      <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h2 mb-1">Gestión de Usuarios</h1>
          <p className="text-muted mb-0">Administrá clientes, mayoristas y cuentas del equipo.</p>
        </div>
        {activeSegment === 'OPERATORS' ? (
          <button
            type="button"
            className="btn btn-primary"
            title="Crear operador"
            aria-label="Crear operador"
            onClick={() => setModalMode('operator')}
          >
            <i className="bi bi-person-plus" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            title="Crear mayorista"
            aria-label="Crear mayorista"
            onClick={() => setModalMode('wholesaler')}
          >
            <i className="bi bi-person-plus" aria-hidden="true" />
          </button>
        )}
      </header>

      {role === 'ADMIN' && (
        <ul className="nav nav-tabs mb-3" aria-label="Segmentos de gestión de usuarios">
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link${activeSegment === 'CLIENTS' ? ' active' : ''}`}
              aria-current={activeSegment === 'CLIENTS' ? 'page' : undefined}
              onClick={() => changeSegment('CLIENTS')}
            >
              Clientes (CUSTOMER / WHOLESALER)
            </button>
          </li>
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link${activeSegment === 'OPERATORS' ? ' active' : ''}`}
              aria-current={activeSegment === 'OPERATORS' ? 'page' : undefined}
              onClick={() => changeSegment('OPERATORS')}
            >
              Equipo Interno (OPERATOR)
            </button>
          </li>
        </ul>
      )}

      <h2 className="h4 mb-3">{title}</h2>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <UsersFilters segment={activeSegment} search={search} roleFilter={roleFilter} statusFilter={statusFilter}
        onSearch={setSearch}
        onRoleChange={(value) => { setRoleFilter(value); setPage(0); }}
        onStatusChange={(value) => { setStatusFilter(value); setPage(0); }} />

      <UsersTable users={pageData.content} segment={activeSegment} isAdmin={role === 'ADMIN'}
        saving={saving} loading={loading} page={page} totalPages={pageData.page.totalPages}
        totalElements={pageData.page.totalElements} onEdit={openEditModal}
        onStatus={(user, deleting) => void handleStatus(user, deleting)}
        onPage={setPage} />

      {modalMode && (
        <UserFormModal
          mode={modalMode}
          saving={saving}
          editingUser={editingUser}
          wholesalerForm={wholesalerForm}
          operatorForm={operatorForm}
          editForm={editForm}
          onWholesalerChange={setWholesalerForm}
          onOperatorChange={setOperatorForm}
          onEditChange={setEditForm}
          onClose={closeModal}
          onCreateWholesaler={(event) => void handleCreateWholesaler(event)}
          onCreateOperator={(event) => void handleCreateOperator(event)}
          onUpdate={(event) => void handleUpdateUser(event)}
        />
      )}

      {false && modalMode && (
        <>
          <div className="modal-backdrop show" />
          <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="admin-user-modal-title">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content position-relative">
              <div className="modal-header">
                <h2 className="modal-title h5" id="admin-user-modal-title">
                  {modalMode === 'wholesaler' && 'Nuevo Mayorista (WHOLESALER)'}
                  {modalMode === 'operator' && 'Nuevo Operador (OPERATOR)'}
                  {modalMode === 'edit' && 'Editar Cliente'}
                </h2>
              </div>

              {modalMode === 'wholesaler' && (
                <form onSubmit={(event) => void handleCreateWholesaler(event)}>
                  <div className="modal-body">
                    <div className="alert alert-info" role="note">
                      La cuenta nace con la contraseña inicial <strong>{INITIAL_PASSWORD}</strong> y deberá cambiarse en el primer inicio de sesión.
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="wholesaler-name">Nombre</label>
                        <input id="wholesaler-name" className="form-control" maxLength={255} required value={wholesalerForm.name} onChange={(event) => setWholesalerForm((current) => ({ ...current, name: event.target.value }))} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="wholesaler-email">Email</label>
                        <input id="wholesaler-email" type="email" className="form-control" maxLength={255} required value={wholesalerForm.email} onChange={(event) => setWholesalerForm((current) => ({ ...current, email: event.target.value }))} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="wholesaler-phone">Teléfono</label>
                        <input id="wholesaler-phone" className="form-control" inputMode="numeric" pattern="\d{10}" title="Ingresá exactamente 10 dígitos." value={wholesalerForm.phone} onChange={(event) => setWholesalerForm((current) => ({ ...current, phone: event.target.value }))} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="wholesaler-company">Razón Social</label>
                        <input id="wholesaler-company" className="form-control" maxLength={255} required value={wholesalerForm.companyName} onChange={(event) => setWholesalerForm((current) => ({ ...current, companyName: event.target.value }))} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="wholesaler-tax-type">Tipo de documento</label>
                        <input id="wholesaler-tax-type" className="form-control" value="CUIT" readOnly />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="wholesaler-tax-number">CUIT</label>
                        <input id="wholesaler-tax-number" className="form-control" inputMode="numeric" pattern="\d{11}" minLength={11} maxLength={11} required value={wholesalerForm.taxIdNumber} onChange={(event) => setWholesalerForm((current) => ({ ...current, taxIdNumber: event.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" title="Cerrar formulario" aria-label="Cerrar formulario" onClick={closeModal} disabled={saving}>
                      <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                    <button type="submit" className="btn btn-primary" title="Crear mayorista" aria-label="Crear mayorista" disabled={saving}>
                      <i className="bi bi-check-lg" aria-hidden="true" />
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'operator' && (
                <form onSubmit={(event) => void handleCreateOperator(event)}>
                  <div className="modal-body">
                    <div className="alert alert-info" role="note">
                      La cuenta nace con la contraseña inicial <strong>{INITIAL_PASSWORD}</strong> y deberá cambiarse en el primer inicio de sesión.
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="operator-name">Nombre</label>
                        <input id="operator-name" className="form-control" maxLength={255} required value={operatorForm.name} onChange={(event) => setOperatorForm((current) => ({ ...current, name: event.target.value }))} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="operator-email">Email</label>
                        <input id="operator-email" type="email" className="form-control" maxLength={255} required value={operatorForm.email} onChange={(event) => setOperatorForm((current) => ({ ...current, email: event.target.value }))} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="operator-phone">Teléfono</label>
                        <input id="operator-phone" className="form-control" inputMode="numeric" pattern="\d{10}" title="Ingresá exactamente 10 dígitos." value={operatorForm.phone} onChange={(event) => setOperatorForm((current) => ({ ...current, phone: event.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" title="Cerrar formulario" aria-label="Cerrar formulario" onClick={closeModal} disabled={saving}>
                      <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                    <button type="submit" className="btn btn-primary" title="Crear operador" aria-label="Crear operador" disabled={saving}>
                      <i className="bi bi-check-lg" aria-hidden="true" />
                    </button>
                  </div>
                </form>
              )}

              {modalMode === 'edit' && editingUser && (
                <form onSubmit={(event) => void handleUpdateUser(event)}>
                  <div className="modal-body">
                    <div className="row g-3 mb-3">
                      <div className="col-md-4">
                        <label className="form-label" htmlFor="edit-user-name">Nombre (solo lectura)</label>
                        <input id="edit-user-name" className="form-control" value={editingUser!.userName} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label" htmlFor="edit-user-email">Email (solo lectura)</label>
                        <input id="edit-user-email" className="form-control" value={editingUser!.userEmail} readOnly />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label" htmlFor="edit-user-phone">Teléfono (solo lectura)</label>
                        <input id="edit-user-phone" className="form-control" value={editingUser!.userPhone ?? ''} readOnly />
                      </div>
                    </div>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="edit-user-role">Rol</label>
                        <select
                          id="edit-user-role"
                          className="form-select"
                          value={editForm.userRole}
                          onChange={(event) => setEditForm((current) => ({ ...current, userRole: event.target.value as CustomerRole }))}
                        >
                          {CUSTOMER_ROLES.map((customerRole) => <option key={customerRole} value={customerRole}>{customerRole}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="edit-company-name">Razón Social</label>
                        <input id="edit-company-name" className="form-control" maxLength={255} value={editForm.companyName} onChange={(event) => setEditForm((current) => ({ ...current, companyName: event.target.value }))} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="edit-tax-type">Tipo de documento</label>
                        <select
                          id="edit-tax-type"
                          className="form-select"
                          value={editForm.taxIdType}
                          required={editForm.userRole === 'WHOLESALER'}
                          onChange={(event) => setEditForm((current) => ({ ...current, taxIdType: event.target.value as TaxIdType | '' }))}
                        >
                          <option value="">Sin documento</option>
                          <option value="CUIT">CUIT</option>
                          <option value="CUIL">CUIL</option>
                          <option value="DNI">DNI</option>
                          <option value="PASAPORTE">PASAPORTE</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="edit-tax-number">Número de documento</label>
                        <input
                          id="edit-tax-number"
                          className="form-control"
                          maxLength={20}
                          inputMode={editForm.userRole === 'WHOLESALER' ? 'numeric' : undefined}
                          pattern={editForm.userRole === 'WHOLESALER' ? '\\d{11}' : undefined}
                          required={editForm.userRole === 'WHOLESALER'}
                          value={editForm.taxIdNumber}
                          onChange={(event) => setEditForm((current) => ({ ...current, taxIdNumber: event.target.value }))}
                        />
                        {editForm.userRole === 'WHOLESALER' && <small className="form-text">Ingresá un CUIT de 11 dígitos.</small>}
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-secondary" title="Cerrar formulario" aria-label="Cerrar formulario" onClick={closeModal} disabled={saving}>
                      <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                    <button type="submit" className="btn btn-primary" title="Guardar cambios" aria-label="Guardar cambios" disabled={saving}>
                      <i className="bi bi-check-lg" aria-hidden="true" />
                    </button>
                  </div>
                </form>
              )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default AdminUsersManager;
