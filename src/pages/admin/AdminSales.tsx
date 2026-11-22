import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import AdminSaleDetailModal from '../../components/admin/AdminSaleDetailModal';
import { searchAdminSales } from '../../services/adminSaleService';
import type { PaymentStatus, SaleStatus, SaleSummaryResponse, SpringPage } from '../../types/sale';

type SalesTab = 'audit' | 'active' | 'history';

interface SalesFilters {
  saleStatus: string;
  paymentStatus: string;
  customerEmail: string;
  startDate: string;
  endDate: string;
}

const ACTIVE_STATUSES: SaleStatus[] = [
  'PENDIENTE',
  'PREPARACION',
  'ENVIADO',
  'RECLAMO_ABIERTO',
];

const HISTORY_STATUSES: SaleStatus[] = [
  'ENTREGADO',
  'CANCELADO',
  'REEMBOLSADO',
  'CERRADO_CON_DEVOLUCION',
];

const ALL_SALE_STATUSES: SaleStatus[] = [
  'PENDIENTE',
  'PREPARACION',
  'ENVIADO',
  'ENTREGADO',
  'CANCELADO',
  'REEMBOLSADO',
  'AUDITORIA',
  'RECLAMO_ABIERTO',
  'CERRADO_CON_DEVOLUCION',
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  'PENDIENTE',
  'APROBADO',
  'RECHAZADO',
  'REEMBOLSO_PENDIENTE',
  'REEMBOLSADO',
];

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

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDIENTE: 'Pendiente',
  APROBADO: 'Aprobado',
  RECHAZADO: 'Rechazado',
  REEMBOLSO_PENDIENTE: 'Reembolso pendiente',
  REEMBOLSADO: 'Reembolsado',
};

const SHIPPING_METHOD_LABELS: Record<SaleSummaryResponse['shippingMethod'], string> = {
  RETIRO_LLAVALLOL: 'Retiro',
  ENVIO_GBA_ZONA_SUR: 'GBA Zona Sur',
  ENVIO_GBA_GENERAL: 'Envío GBA',
  ENVIO_CORREO_NACIONAL: 'Correo nacional',
};

const EMPTY_FILTERS: SalesFilters = {
  saleStatus: '',
  paymentStatus: '',
  customerEmail: '',
  startDate: '',
  endDate: '',
};

const EMPTY_PAGE: SpringPage<SaleSummaryResponse> = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 20,
  first: true,
  last: true,
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date);
};

const toStartOfDayIso = (value: string): string | undefined => {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) return undefined;
  return date.toISOString();
};

const toEndOfDayIso = (value: string): string | undefined => {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day, 23, 59, 59, 999);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) return undefined;
  return date.toISOString();
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'No se pudieron cargar las ventas.';

const AdminSales = () => {
  const [tab, setTab] = useState<SalesTab>('audit');
  const [draftFilters, setDraftFilters] = useState<SalesFilters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<SalesFilters>(EMPTY_FILTERS);
  const [pageData, setPageData] = useState(EMPTY_PAGE);
  const [page, setPage] = useState(0);
  const [auditCount, setAuditCount] = useState(0);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  const loadSales = useCallback(async () => {
    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    setLoading(true);
    setError('');
    const startDate = toStartOfDayIso(filters.startDate);
    const endDate = toEndOfDayIso(filters.endDate);

    const commonFilters = tab === 'audit'
      ? { auditOnly: true }
      : {
        statuses: tab === 'active' ? ACTIVE_STATUSES : HISTORY_STATUSES,
        ...(tab === 'active' ? { fiscalRejection: false } : {}),
        ...(filters.saleStatus ? { saleStatus: filters.saleStatus as SaleStatus } : {}),
        ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus as PaymentStatus } : {}),
        ...(filters.customerEmail.trim() ? { customerEmail: filters.customerEmail.trim() } : {}),
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      };

    try {
      const [result, auditResult] = await Promise.all([
        searchAdminSales({ ...commonFilters, page, size: 20 }),
        searchAdminSales({ auditOnly: true, page: 0, size: 1 }),
      ]);
      if (requestId.current !== currentRequestId) return;
      setPageData(result);
      setAuditCount(auditResult.totalElements);
    } catch (requestError) {
      if (requestId.current === currentRequestId) setError(getErrorMessage(requestError));
    } finally {
      if (requestId.current === currentRequestId) setLoading(false);
    }
  }, [filters, page, tab]);

  useEffect(() => {
    void loadSales();
  }, [loadSales]);

  const changeTab = (nextTab: SalesTab) => {
    setTab(nextTab);
    setPage(0);
    setDraftFilters(EMPTY_FILTERS);
    setFilters(EMPTY_FILTERS);
  };

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(0);
    setFilters(draftFilters);
  };

  const changeDraftFilter = (key: keyof SalesFilters, value: string) => {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  };

  const statusOptions = tab === 'active'
    ? ACTIVE_STATUSES
    : tab === 'history' ? HISTORY_STATUSES : ALL_SALE_STATUSES;

  const closeDetail = () => {
    setSelectedSaleId(null);
    void loadSales();
  };

  return (
    <section>
      <header className="mb-4">
        <h1 className="h2">Gestión de Ventas</h1>
        <p className="text-muted mb-0">Administrá ventas, pagos, auditorías y comprobantes fiscales.</p>
      </header>

      <div className="nav nav-tabs mb-4" role="tablist" aria-label="Grupos de ventas">
        <button
          type="button"
          className={`nav-link${tab === 'audit' ? ' active' : ''}`}
          role="tab"
          aria-selected={tab === 'audit'}
          onClick={() => changeTab('audit')}
        >
          Requieren Auditoría (Urgente)
          <span className="badge text-bg-danger ms-2">{auditCount}</span>
        </button>
        <button
          type="button"
          className={`nav-link${tab === 'active' ? ' active' : ''}`}
          role="tab"
          aria-selected={tab === 'active'}
          onClick={() => changeTab('active')}
        >
          Ventas Activas
        </button>
        <button
          type="button"
          className={`nav-link${tab === 'history' ? ' active' : ''}`}
          role="tab"
          aria-selected={tab === 'history'}
          onClick={() => changeTab('history')}
        >
          Historial de Ventas
        </button>
      </div>

      {tab !== 'audit' && (
        <form className="card card-body mb-4" onSubmit={(event) => handleApplyFilters(event)}>
          <div className="row g-2 align-items-end">
            <div className="col-12 col-sm-6 col-lg-2">
              <label className="form-label" htmlFor="admin-sales-status">Estado de venta</label>
              <select
                id="admin-sales-status"
                className="form-select"
                value={draftFilters.saleStatus}
                onChange={(event) => changeDraftFilter('saleStatus', event.target.value)}
              >
                <option value="">Todos</option>
                {statusOptions.map((status) => (
                  <option value={status} key={status}>{SALE_STATUS_LABELS[status]}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-6 col-lg-2">
              <label className="form-label" htmlFor="admin-sales-payment-status">Estado de pago</label>
              <select
                id="admin-sales-payment-status"
                className="form-select"
                value={draftFilters.paymentStatus}
                onChange={(event) => changeDraftFilter('paymentStatus', event.target.value)}
              >
                <option value="">Todos</option>
                {PAYMENT_STATUSES.map((status) => (
                  <option value={status} key={status}>{PAYMENT_STATUS_LABELS[status]}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-4 col-lg-4">
              <label className="form-label" htmlFor="admin-sales-email">Email del cliente</label>
              <input
                id="admin-sales-email"
                type="search"
                className="form-control"
                value={draftFilters.customerEmail}
                onChange={(event) => changeDraftFilter('customerEmail', event.target.value)}
              />
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label" htmlFor="admin-sales-from">Desde</label>
              <input
                id="admin-sales-from"
                type="date"
                className="form-control"
                value={draftFilters.startDate}
                onChange={(event) => changeDraftFilter('startDate', event.target.value)}
              />
            </div>
            <div className="col-12 col-sm-6 col-md-4 col-lg-2">
              <label className="form-label" htmlFor="admin-sales-to">Hasta</label>
              <input
                id="admin-sales-to"
                type="date"
                className="form-control"
                value={draftFilters.endDate}
                onChange={(event) => changeDraftFilter('endDate', event.target.value)}
              />
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-primary" title="Aplicar filtros" aria-label="Aplicar filtros">
                <i className="bi bi-funnel" aria-hidden="true" />
              </button>
            </div>
          </div>
        </form>
      )}

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Envío</th>
                <th>Método de pago</th>
                <th>Pago</th>
                <th>Estado de venta</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-4 text-center">Cargando ventas…</td></tr>
              ) : pageData.content.length === 0 ? (
                <tr><td colSpan={9} className="py-4 text-center">No hay ventas para mostrar.</td></tr>
              ) : pageData.content.map((sale) => (
                <tr key={sale.saleId}>
                  <td><code>{sale.saleId.slice(-8).toUpperCase()}</code></td>
                  <td>{formatDate(sale.createdAt)}</td>
                  <td>{sale.customerName}<br /><small className="text-muted">{sale.customerEmail}</small></td>
                  <td>{SHIPPING_METHOD_LABELS[sale.shippingMethod]}</td>
                  <td>{sale.paymentMethod.replace(/_/g, ' ')}</td>
                  <td><span className="badge text-bg-secondary">{PAYMENT_STATUS_LABELS[sale.paymentStatus]}</span></td>
                  <td>
                    <span className="badge text-bg-primary">{SALE_STATUS_LABELS[sale.saleStatus]}</span>
                    {sale.fiscalRejection && (
                      <span className="badge text-bg-danger ms-1">ARCA Rechazada</span>
                    )}
                  </td>
                  <td>{formatCurrency(sale.saleTotal)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      title={`Ver detalle de venta ${sale.saleId.slice(-8).toUpperCase()}`}
                      aria-label={`Ver detalle de venta ${sale.saleId.slice(-8).toUpperCase()}`}
                      onClick={() => setSelectedSaleId(sale.saleId)}
                    >
                      <i className="bi bi-eye" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
        <span className="text-muted">
          {pageData.totalElements} ventas · Página {pageData.totalPages === 0 ? 0 : page + 1} de {pageData.totalPages}
        </span>
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={page === 0 || loading}
            onClick={() => setPage((current) => Math.max(0, current - 1))}
          >
            Anterior
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            disabled={loading || pageData.totalPages === 0 || page + 1 >= pageData.totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>

      {selectedSaleId && (
        <AdminSaleDetailModal
          saleId={selectedSaleId}
          onClose={closeDetail}
          onUpdated={() => void loadSales()}
        />
      )}
    </section>
  );
};

export default AdminSales;
