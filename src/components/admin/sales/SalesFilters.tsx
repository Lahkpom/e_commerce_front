import type { FormEvent } from 'react';
import type { PaymentStatus, SaleStatus } from '../../../types/sale';

export interface SalesFilterValues {
  saleStatus: string;
  paymentStatus: string;
  customerEmail: string;
  startDate: string;
  endDate: string;
}

interface SalesFiltersProps {
  filters: SalesFilterValues;
  statuses: SaleStatus[];
  onChange: (key: keyof SalesFilterValues, value: string) => void;
  onApply: (event: FormEvent<HTMLFormElement>) => void;
}

const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  PENDIENTE: 'Pendiente',
  PREPARACION: 'En preparación',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  REEMBOLSADO: 'Reembolsado',
  AUDITORIA: 'Auditoría',
  RECLAMO_ABIERTO: 'Reclamo abierto',
  CERRADO_CON_DEVOLUCION: 'Cerrado con devolución',
};
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'REEMBOLSO_PENDIENTE', 'REEMBOLSADO'];
const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', RECHAZADO: 'Rechazado',
  REEMBOLSO_PENDIENTE: 'Reembolso pendiente', REEMBOLSADO: 'Reembolsado',
};

const SalesFilters = ({ filters, statuses, onChange, onApply }: SalesFiltersProps) => (
  <form className="card card-body mb-4" onSubmit={onApply}>
    <div className="row g-2 align-items-end">
      <div className="col-12 col-sm-6 col-lg-2">
        <label className="form-label" htmlFor="admin-sales-status">Estado de venta</label>
        <select id="admin-sales-status" className="form-select" value={filters.saleStatus}
          onChange={(event) => onChange('saleStatus', event.target.value)}>
          <option value="">Todos</option>
          {statuses.map((status) => <option value={status} key={status}>{SALE_STATUS_LABELS[status]}</option>)}
        </select>
      </div>
      <div className="col-12 col-sm-6 col-lg-2">
        <label className="form-label" htmlFor="admin-sales-payment-status">Estado de pago</label>
        <select id="admin-sales-payment-status" className="form-select" value={filters.paymentStatus}
          onChange={(event) => onChange('paymentStatus', event.target.value)}>
          <option value="">Todos</option>
          {PAYMENT_STATUSES.map((status) => <option value={status} key={status}>{PAYMENT_STATUS_LABELS[status]}</option>)}
        </select>
      </div>
      <div className="col-12 col-md-4 col-lg-4">
        <label className="form-label" htmlFor="admin-sales-email">Email del cliente</label>
        <input id="admin-sales-email" type="search" className="form-control" value={filters.customerEmail}
          onChange={(event) => onChange('customerEmail', event.target.value)} />
      </div>
      <div className="col-12 col-sm-6 col-md-4 col-lg-2">
        <label className="form-label" htmlFor="admin-sales-from">Desde</label>
        <input id="admin-sales-from" type="date" className="form-control" value={filters.startDate}
          onChange={(event) => onChange('startDate', event.target.value)} />
      </div>
      <div className="col-12 col-sm-6 col-md-4 col-lg-2">
        <label className="form-label" htmlFor="admin-sales-to">Hasta</label>
        <input id="admin-sales-to" type="date" className="form-control" value={filters.endDate}
          onChange={(event) => onChange('endDate', event.target.value)} />
      </div>
      <div className="col-12">
        <button type="submit" className="btn btn-primary" title="Aplicar filtros" aria-label="Aplicar filtros">
          <i className="bi bi-funnel" aria-hidden="true" />
        </button>
      </div>
    </div>
  </form>
);

export default SalesFilters;
