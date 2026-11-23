import { useEffect, useState } from 'react';
import type { SaleResponse, SaleStatus, PaymentStatus } from '../../types/sale';
import { cancelMyOrder, getMyOrderDetail } from '../../services/saleService';
import { getReturnsByOrder } from '../../services/saleReturnService';
import type { ReturnReason, ReturnResolution, SaleReturnResponse } from '../../types/saleReturn';
import BankTransferInstructionsCard from '../checkout/BankTransferInstructionsCard';
import './MyOrders.scss';

interface OrderDetailModalProps {
  saleId: string;
  onClose: () => void;
  onOrderUpdated?: (sale: SaleResponse) => void;
}

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

const RETURN_STATUS_LABELS: Record<SaleReturnResponse['returnStatus'], string> = {
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

const SHIPPING_METHOD_LABELS: Record<SaleResponse['shippingMethod'], string> = {
  RETIRO_LLAVALLOL: 'Retiro en Llavallol',
  ENVIO_GBA_ZONA_SUR: 'Envío GBA - Zona Sur',
  ENVIO_GBA_GENERAL: 'Envío GBA',
  ENVIO_CORREO_NACIONAL: 'Correo nacional',
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (date: string): string => {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(parsedDate);
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Ocurrió un error inesperado. Intentá nuevamente.';

const OrderDetailModal = ({ saleId, onClose, onOrderUpdated }: OrderDetailModalProps) => {
  const [sale, setSale] = useState<SaleResponse | null>(null);
  const [returns, setReturns] = useState<SaleReturnResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReturns, setLoadingReturns] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returnsError, setReturnsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.allSettled([getMyOrderDetail(saleId), getReturnsByOrder(saleId)])
      .then(([saleResult, returnResult]) => {
        if (!active) return;
        if (saleResult.status === 'fulfilled') {
          setSale(saleResult.value);
        } else {
          setError(getErrorMessage(saleResult.reason));
        }
        if (returnResult.status === 'fulfilled') {
          setReturns(returnResult.value);
        } else {
          setReturnsError(getErrorMessage(returnResult.reason));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setLoadingReturns(false);
        }
      });

    return () => {
      active = false;
    };
  }, [saleId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !cancelling) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cancelling, onClose]);

  const canCancel = sale?.saleStatus === 'PENDIENTE' || sale?.saleStatus === 'PREPARACION';
  const showContactNotice = sale
    && !canCancel
    && sale.saleStatus !== 'CANCELADO'
    && sale.saleStatus !== 'ENTREGADO';

  const handleCancel = async () => {
    if (!sale || !window.confirm('¿Querés cancelar esta orden? Esta acción no se puede deshacer.')) {
      return;
    }

    setCancelling(true);
    setError(null);
    try {
      const updatedSale = await cancelMyOrder(sale.saleId);
      setSale(updatedSale);
      onOrderUpdated?.(updatedSale);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div
      className="my-orders__modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !cancelling) onClose();
      }}
    >
      <section
        className="my-orders__modal my-orders__modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
      >
        <header className="my-orders__modal-header">
          <div>
            <p className="my-orders__eyebrow mb-1">Detalle de orden</p>
            <h2 className="my-orders__modal-title" id="order-detail-title">
              {sale ? `Orden #${sale.saleId.slice(-8).toUpperCase()}` : 'Orden'}
            </h2>
          </div>
          <button type="button" className="my-orders__icon-button" onClick={onClose} aria-label="Cerrar detalle">
            ×
          </button>
        </header>

        <div className="my-orders__modal-body">
          {loading && <p role="status">Cargando detalle de la orden…</p>}
          {error && <div className="my-orders__alert my-orders__alert--error" role="alert">{error}</div>}

          {sale && !loading && (
            <>
              <div className="my-orders__detail-heading">
                <p className="my-orders__muted mb-2">{formatDate(sale.createdAt)}</p>
                <div className="my-orders__badges">
                  <span className={`my-orders__badge my-orders__badge--sale my-orders__badge--${sale.saleStatus.toLowerCase()}`}>
                    {SALE_STATUS_LABELS[sale.saleStatus]}
                  </span>
                  <span className={`my-orders__badge my-orders__badge--payment my-orders__badge--${sale.paymentStatus.toLowerCase()}`}>
                    {PAYMENT_STATUS_LABELS[sale.paymentStatus]}
                  </span>
                </div>
              </div>

              <section className="my-orders__detail-section" aria-labelledby="order-items-title">
                <h3 className="my-orders__section-title" id="order-items-title">Productos</h3>
                <div className="my-orders__items">
                  {sale.items.map((item) => (
                    <article className="my-orders__item" key={item.saleItemId}>
                      {item.imageUrl
                        ? <img className="my-orders__item-image" src={item.imageUrl} alt={item.productName} />
                        : <div className="my-orders__item-image my-orders__item-image--empty" aria-hidden="true">Producto</div>}
                      <div className="my-orders__item-info">
                        <h4>{item.productName}</h4>
                        <p className="my-orders__muted mb-1">
                          {[item.variantSize, item.colorName].filter(Boolean).join(' · ') || 'Variante no especificada'}
                        </p>
                        {item.variantSku && <p className="my-orders__muted mb-1">SKU: {item.variantSku}</p>}
                        <p className="my-orders__muted mb-0">
                          {item.quantity} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      <strong className="my-orders__item-subtotal">{formatCurrency(item.subtotal)}</strong>
                    </article>
                  ))}
                </div>
              </section>

              <section className="my-orders__detail-section" aria-labelledby="order-shipping-title">
                <h3 className="my-orders__section-title" id="order-shipping-title">Entrega</h3>
                <p className="mb-1"><strong>{SHIPPING_METHOD_LABELS[sale.shippingMethod]}</strong></p>
                {sale.shippingAddress && <p className="mb-1">{sale.shippingAddress}</p>}
                <p className="my-orders__muted mb-0">
                  {[sale.shippingLocality, sale.shippingProvince, sale.shippingPostalCode]
                    .filter(Boolean)
                    .join(', ') || 'Sin datos adicionales de entrega'}
                </p>
                {sale.shippingMethod === 'ENVIO_CORREO_NACIONAL' && (
                  <div className="my-orders__tracking-note" role="status">
                    <strong>Seguimiento por correo</strong>
                    <span>Disponible próximamente. Te enviaremos las novedades por correo electrónico.</span>
                  </div>
                )}
              </section>

              <section className="my-orders__detail-section" aria-labelledby="order-returns-title">
                <h3 className="my-orders__section-title" id="order-returns-title">Devoluciones asociadas</h3>
                {loadingReturns && <p role="status">Consultando solicitudes de devolución…</p>}
                {returnsError && <div className="my-orders__alert my-orders__alert--error" role="alert">{returnsError}</div>}
                {!loadingReturns && !returnsError && returns.length === 0 && (
                  <p className="my-orders__muted mb-0">Esta orden no tiene solicitudes de devolución asociadas.</p>
                )}
                <div className="my-orders__list">
                  {returns.map((returnCase) => (
                    <article className="my-orders__card my-orders__return-card" key={returnCase.returnId}>
                      <div className="my-orders__card-top">
                        <div>
                          <h4 className="h6 mb-1">Solicitud de devolución</h4>
                          <p className="my-orders__muted mb-0">{formatDate(returnCase.createdAt)}</p>
                        </div>
                        <span className="my-orders__badge my-orders__badge--sale">
                          {RETURN_STATUS_LABELS[returnCase.returnStatus]}
                        </span>
                      </div>
                      <dl className="my-orders__return-details">
                        <div><dt>Motivo</dt><dd>{RETURN_REASON_LABELS[returnCase.returnReason]}</dd></div>
                        <div><dt>Resolución solicitada</dt><dd>{RETURN_RESOLUTION_LABELS[returnCase.returnResolution]}</dd></div>
                        <div><dt>Comentario enviado</dt><dd>{returnCase.customerNotes || 'Sin comentario'}</dd></div>
                        {returnCase.returnShippingGuide && (
                          <div><dt>Guía de devolución</dt><dd>{returnCase.returnShippingGuide}</dd></div>
                        )}
                        {returnCase.inspectionNotes && (
                          <div><dt>Notas de resolución del comercio</dt><dd>{returnCase.inspectionNotes}</dd></div>
                        )}
                        {returnCase.refundAmount !== null && (
                          <div><dt>Monto reembolsado</dt><dd>{formatCurrency(returnCase.refundAmount)}</dd></div>
                        )}
                      </dl>
                      <h5 className="h6 mt-3">Ítems reclamados</h5>
                      <ul className="mb-0">
                        {returnCase.items.map((item) => (
                          <li key={item.returnItemId}>
                            {item.quantity} × {item.productName}
                            {[item.variantSize, item.colorName].filter(Boolean).length > 0
                              ? ` · ${[item.variantSize, item.colorName].filter(Boolean).join(' · ')}`
                              : ''}
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>

              <section className="my-orders__detail-section" aria-labelledby="order-total-title">
                <h3 className="my-orders__section-title" id="order-total-title">Resumen de pago</h3>
                <dl className="my-orders__totals">
                  <div><dt>Subtotal</dt><dd>{formatCurrency(sale.saleSubtotal)}</dd></div>
                  <div><dt>Descuento</dt><dd>−{formatCurrency(sale.saleDiscountAmount)}</dd></div>
                  <div><dt>Costo de envío</dt><dd>{formatCurrency(sale.shippingCost)}</dd></div>
                  <div className="my-orders__grand-total"><dt>Total</dt><dd>{formatCurrency(sale.saleTotal)}</dd></div>
                </dl>
              </section>

              {sale.paymentMethod === 'TRANSFERENCIA' && sale.paymentStatus === 'PENDIENTE' && (
                <BankTransferInstructionsCard
                  saleId={sale.saleId}
                  saleTotal={sale.saleTotal}
                  paymentStatus={sale.paymentStatus}
                />
              )}

              {canCancel && (
                <div className="my-orders__modal-actions">
                  <button
                    type="button"
                    className="my-orders__button my-orders__button--danger"
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Cancelando…' : 'Cancelar orden'}
                  </button>
                </div>
              )}
              {showContactNotice && (
                <p className="my-orders__contact-notice" role="note">
                  Para solicitar modificaciones o cancelaciones en este estado, comunicate con nosotros por nuestros canales de contacto.
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default OrderDetailModal;
