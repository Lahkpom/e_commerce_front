import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import AdminSaleDetailModal from './AdminSaleDetailModal';
import SalesFilters, { type SalesFilterValues } from './SalesFilters';
import SalesTable from './SalesTable';
import { searchAdminSales } from '../../../services/adminSaleService';
import type { PaymentStatus, SaleStatus, SaleSummaryResponse, SpringPage } from '../../../types/sale';
import './AdminSales.scss';

type SalesTab = 'audit' | 'active' | 'history';

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

const EMPTY_FILTERS: SalesFilterValues = {
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

const AdminSalesManager = () => {
  const [tab, setTab] = useState<SalesTab>('audit');
  const [draftFilters, setDraftFilters] = useState<SalesFilterValues>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<SalesFilterValues>(EMPTY_FILTERS);
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

  const changeDraftFilter = (key: keyof SalesFilterValues, value: string) => {
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

      {tab !== 'audit' && <SalesFilters filters={draftFilters} statuses={statusOptions}
        onChange={changeDraftFilter} onApply={handleApplyFilters} />}

      {error && <div className="alert alert-danger" role="alert">{error}</div>}

      <SalesTable sales={pageData.content} loading={loading} onSelect={setSelectedSaleId} />

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

export default AdminSalesManager;
