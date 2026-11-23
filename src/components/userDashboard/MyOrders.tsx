import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  getMyOrderDetail,
  getMyOrders,
  retryMercadoPagoPayment,
} from '../../services/saleService';
import { getMyReturns } from '../../services/saleReturnService';
import type { PaymentStatus, SaleResponse, SaleStatus, SaleSummaryResponse } from '../../types/sale';
import type { ReturnReason, ReturnResolution, SaleReturnSummaryResponse } from '../../types/saleReturn';
import OrderDetailModal from './OrderDetailModal';
import ReturnRequestModal from './ReturnRequestModal';
import './MyOrders.scss';

interface MyOrdersProps {
  mode: 'active' | 'history';
}

type OrdersTab = 'active' | 'returns' | 'history';
type HistoryStatus = 'TODOS' | 'ENTREGADO' | 'CANCELADO';

const ACTIVE_STATUSES: SaleStatus[] = [
  'PENDIENTE',
  'PREPARACION',
  'ENVIADO',
  'AUDITORIA',
];

const HISTORY_STATUSES: SaleStatus[] = [
  'ENTREGADO',
  'CANCELADO',
];

const RETURN_SALE_STATUSES: SaleStatus[] = [
  'RECLAMO_ABIERTO',
  'REEMBOLSADO',
  'CERRADO_CON_DEVOLUCION',
];

const HISTORY_FILTERS: { value: HistoryStatus; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'ENTREGADO', label: 'Entregado' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

const RETURN_STATUS_LABELS: Record<SaleReturnSummaryResponse['returnStatus'], string> = {
  SOLICITADA: 'Solicitada',
  EN_TRANSITO: 'En tránsito',
  RECIBIDO_EN_CONTROL: 'Recibida en control',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
};

const RETURN_REASON_LABELS: Record<ReturnReason, string> = {
  ARREPENTIMIENTO_LEGAL: 'Arrepentimiento legal',
  CAMBIO_TALLE: 'Cambio de talle',
  DEFECTO_FABRICACION: 'Defecto de fabricación',
};

const RETURN_RESOLUTION_LABELS: Record<ReturnResolution, string> = {
  REEMBOLSO_DINERO: 'Reembolso de dinero',
  CAMBIO_PRODUCTO: 'Cambio de producto',
  CREDITO_TIENDA: 'Crédito en tienda',
};

const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  PENDIENTE: 'Pendiente',
  PREPARACION: 'En preparación',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  REEMBOLSADO: 'Reembolsado',
  AUDITORIA: 'En revisión',
  RECLAMO_ABIERTO: 'Reclamo abierto',
  CERRADO_CON_DEVOLUCION: 'Cerrado con devolución',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDIENTE: 'Pago pendiente',
  APROBADO: 'Pago aprobado',
  RECHAZADO: 'Pago rechazado',
  REEMBOLSO_PENDIENTE: 'Reembolso pendiente',
  REEMBOLSADO: 'Reembolsado',
};

const RETURN_WINDOW_MS = 10 * 24 * 60 * 60 * 1000;

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (date: string): string => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(parsedDate);
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Ocurrió un error inesperado. Intentá nuevamente.';

const canRequestReturn = (sale: SaleSummaryResponse): boolean => {
  if (sale.saleStatus !== 'ENTREGADO' || !sale.saleDeliveredAt) return false;
  const deliveredAt = new Date(sale.saleDeliveredAt).getTime();
  const elapsed = Date.now() - deliveredAt;
  return Number.isFinite(deliveredAt) && elapsed >= 0 && elapsed <= RETURN_WINDOW_MS;
};

const MyOrders = ({ mode }: MyOrdersProps) => {
  const [orders, setOrders] = useState<SaleSummaryResponse[]>([]);
  const [returns, setReturns] = useState<SaleReturnSummaryResponse[]>([]);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<HistoryStatus>('TODOS');
  const [tab, setTab] = useState<OrdersTab>(mode);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [returnSale, setReturnSale] = useState<SaleResponse | null>(null);
  const [loadingReturn, setLoadingReturn] = useState<string | null>(null);
  const [retryingSale, setRetryingSale] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const title = 'Mis compras';

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const load = tab === 'returns'
      ? Promise.all([
        getMyReturns(page, 15),
        getMyOrders({ statuses: RETURN_SALE_STATUSES, page, size: 15 }),
      ]).then(([returnPage, salePage]) => {
        if (!active) return;
        setReturns(returnPage.content);
        setOrders(salePage.content);
        setPageCount(Math.max(returnPage.page.totalPages, salePage.page.totalPages));
      })
      : getMyOrders(tab === 'active'
        ? { statuses: ACTIVE_STATUSES, page, size: 15 }
        : {
          statuses: selectedStatus === 'TODOS' ? HISTORY_STATUSES : [selectedStatus],
          page,
          size: 15,
        }).then((response) => {
        if (!active) return;
        setOrders(response.content);
        setReturns([]);
        setPageCount(response.page.totalPages);
      });

    load
      .catch((requestError: unknown) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, selectedStatus, tab, refreshKey]);

  const handleFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(event.target.value as HistoryStatus);
    setPage(0);
  };

  const changeTab = (nextTab: OrdersTab) => {
    setTab(nextTab);
    setPage(0);
    setSelectedStatus('TODOS');
  };

  const handleRetryPayment = async (saleId: string) => {
    setRetryingSale(saleId);
    setError(null);
    try {
      const sale = await retryMercadoPagoPayment(saleId);
      if (!sale.mpInitPoint) {
        throw new Error('Mercado Pago no devolvió un enlace para completar el pago.');
      }
      window.location.assign(sale.mpInitPoint);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
      setRetryingSale(null);
    }
  };

  const handleRequestReturn = async (saleId: string) => {
    setLoadingReturn(saleId);
    setError(null);
    try {
      const sale = await getMyOrderDetail(saleId);
      setReturnSale(sale);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoadingReturn(null);
    }
  };

  const handleSaleUpdated = () => {
    setRefreshKey((current) => current + 1);
  };

  const handleReturnSuccess = () => {
    setNotice('Tu solicitud de devolución se envió correctamente.');
    setRefreshKey((current) => current + 1);
  };

  return (
    <section className="my-orders">
      <header className="my-orders__header">
        <div>
          <p className="my-orders__eyebrow mb-1">Mi cuenta</p>
          <h2 className="h4 mb-0">{title}</h2>
        </div>
      </header>

      <div className="nav nav-tabs my-orders__tabs mb-4" role="tablist" aria-label="Pestañas de mis compras">
        <button type="button" className={`nav-link${tab === 'active' ? ' active' : ''}`}
          role="tab" aria-selected={tab === 'active'} onClick={() => changeTab('active')}>
          En Curso
        </button>
        <button type="button" className={`nav-link${tab === 'returns' ? ' active' : ''}`}
          role="tab" aria-selected={tab === 'returns'} onClick={() => changeTab('returns')}>
          Devoluciones y Reembolsos
        </button>
        <button type="button" className={`nav-link${tab === 'history' ? ' active' : ''}`}
          role="tab" aria-selected={tab === 'history'} onClick={() => changeTab('history')}>
          Historial
        </button>
      </div>

      {tab === 'history' && (
        <div className="my-orders__filters">
          <label htmlFor="order-status-filter">Filtrar por estado</label>
          <select
            id="order-status-filter"
            className="my-orders__select"
            value={selectedStatus}
            onChange={handleFilterChange}
          >
            {HISTORY_FILTERS.map(({ value, label }) => (
              <option value={value} key={value}>{label}</option>
            ))}
          </select>
        </div>
      )}

      {error && <div className="my-orders__alert my-orders__alert--error" role="alert">{error}</div>}
      {notice && (
        <div className="my-orders__alert my-orders__alert--success" role="status">
          <span>{notice}</span>
          <button type="button" className="my-orders__dismiss" onClick={() => setNotice(null)} aria-label="Cerrar aviso">×</button>
        </div>
      )}
      {loading && <p className="my-orders__empty" role="status">Cargando órdenes…</p>}
      {!loading && !error && orders.length === 0 && returns.length === 0 && (
        <p className="my-orders__empty">
          {tab === 'active'
            ? 'No tenés órdenes activas en este momento.'
            : tab === 'returns'
              ? 'Todavía no tenés devoluciones o reembolsos para mostrar.'
              : 'No encontramos órdenes para este filtro.'}
        </p>
      )}

      {tab === 'returns' && !loading && returns.length > 0 && (
        <div className="my-orders__list mb-4">
          {returns.map((returnCase) => (
            <article className="my-orders__card my-orders__return-card" key={returnCase.returnId}>
              <div className="my-orders__card-top">
                <div>
                  <h3 className="my-orders__order-code">Devolución · Orden #{returnCase.saleId.slice(-8).toUpperCase()}</h3>
                  <p className="my-orders__muted mb-0">{formatDate(returnCase.createdAt)}</p>
                </div>
                <span className="my-orders__badge my-orders__badge--sale">
                  {RETURN_STATUS_LABELS[returnCase.returnStatus]}
                </span>
              </div>
              <div className="my-orders__card-summary">
                <span><strong>Motivo:</strong> {RETURN_REASON_LABELS[returnCase.returnReason]}</span>
                <span><strong>Resolución:</strong> {RETURN_RESOLUTION_LABELS[returnCase.returnResolution]}</span>
                {returnCase.refundAmount !== null && (
                  <span><strong>Reembolso:</strong> {formatCurrency(returnCase.refundAmount)}</span>
                )}
              </div>
              <button type="button" className="my-orders__button my-orders__button--secondary"
                onClick={() => setSelectedSaleId(returnCase.saleId)}>
                Ver detalle de la orden
              </button>
            </article>
          ))}
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="my-orders__list">
          {orders.map((order) => {
            const canRetryPayment = tab === 'active'
              && order.paymentMethod === 'MERCADO_PAGO'
              && order.saleStatus === 'PENDIENTE'
              && (order.paymentStatus === 'PENDIENTE' || order.paymentStatus === 'RECHAZADO');
            const canReturn = tab === 'history' && canRequestReturn(order);

            return (
              <article className="my-orders__card" key={order.saleId}>
                <div className="my-orders__card-top">
                  <div>
                    <h3 className="my-orders__order-code">Orden #{order.saleId.slice(-8).toUpperCase()}</h3>
                    <p className="my-orders__muted mb-0">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="my-orders__badges">
                    <span className={`my-orders__badge my-orders__badge--sale my-orders__badge--${order.saleStatus.toLowerCase()}`}>
                      {SALE_STATUS_LABELS[order.saleStatus]}
                    </span>
                    <span className={`my-orders__badge my-orders__badge--payment my-orders__badge--${order.paymentStatus.toLowerCase()}`}>
                      {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                    </span>
                  </div>
                </div>

                <div className="my-orders__card-summary">
                  <span>{order.saleQuantity} {order.saleQuantity === 1 ? 'unidad' : 'unidades'}</span>
                  <span><strong>Total:</strong> {formatCurrency(order.saleTotal)}</span>
                </div>

                <div className="my-orders__card-actions">
                  <button
                    type="button"
                    className="my-orders__button my-orders__button--secondary"
                    onClick={() => setSelectedSaleId(order.saleId)}
                  >
                    Ver detalle
                  </button>
                  {canRetryPayment && (
                    <button
                      type="button"
                      className="my-orders__button my-orders__button--primary"
                      onClick={() => handleRetryPayment(order.saleId)}
                      disabled={retryingSale === order.saleId}
                    >
                      {retryingSale === order.saleId
                        ? 'Conectando con Mercado Pago…'
                        : 'Completar pago con Mercado Pago'}
                    </button>
                  )}
                  {canReturn && (
                    <button
                      type="button"
                      className="my-orders__button my-orders__button--danger"
                      onClick={() => handleRequestReturn(order.saleId)}
                      disabled={loadingReturn === order.saleId}
                    >
                      {loadingReturn === order.saleId ? 'Cargando orden…' : 'Solicitar devolución'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pageCount > 1 && (
        <nav className="my-orders__pagination" aria-label="Paginación del historial de órdenes">
          <button
            type="button"
            className="my-orders__button my-orders__button--secondary"
            onClick={() => setPage((current) => Math.max(0, current - 1))}
            disabled={page === 0 || loading}
          >
            Anterior
          </button>
          <span aria-live="polite">Página {page + 1} de {pageCount}</span>
          <button
            type="button"
            className="my-orders__button my-orders__button--secondary"
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
            disabled={page >= pageCount - 1 || loading}
          >
            Siguiente
          </button>
        </nav>
      )}

      {selectedSaleId && (
        <OrderDetailModal
          saleId={selectedSaleId}
          onClose={() => setSelectedSaleId(null)}
          onOrderUpdated={handleSaleUpdated}
        />
      )}
      {returnSale && (
        <ReturnRequestModal
          sale={returnSale}
          onClose={() => setReturnSale(null)}
          onSuccess={handleReturnSuccess}
        />
      )}
    </section>
  );
};

export default MyOrders;
