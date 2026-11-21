import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { getFiscalReceiptsBySale, retryRejectedInvoice } from '../../services/adminFiscalService';
import {
  getAdminSaleDetail,
  updateAdminPaymentStatus,
  updateAdminSaleFiscalData,
  updateAdminSaleNotes,
  updateAdminSaleStatus,
} from '../../services/adminSaleService';
import type { FiscalReceiptResponse } from '../../types/fiscal';
import type {
  PaymentStatus,
  SaleResponse,
  SaleStatus,
  TaxIdType,
} from '../../types/sale';
import '../userDashboard/MyOrders.scss';

interface AdminSaleDetailModalProps {
  saleId: string;
  onClose: () => void;
  onUpdated?: () => void;
}

const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  PENDIENTE: 'Pendiente',
  PREPARACION: 'En preparación',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  REEMBOLSADO: 'Reembolsado',
  AUDITORIA: 'En auditoría',
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

const SHIPPING_METHOD_LABELS: Record<SaleResponse['shippingMethod'], string> = {
  RETIRO_LLAVALLOL: 'Retiro en Llavallol',
  ENVIO_GBA_ZONA_SUR: 'Envío GBA - Zona Sur',
  ENVIO_GBA_GENERAL: 'Envío GBA',
  ENVIO_CORREO_NACIONAL: 'Correo nacional',
};

const VALID_TRANSITIONS: Record<SaleStatus, SaleStatus[]> = {
  PENDIENTE: ['PREPARACION', 'AUDITORIA', 'CANCELADO'],
  AUDITORIA: ['PREPARACION', 'CANCELADO'],
  PREPARACION: ['ENVIADO', 'CANCELADO'],
  ENVIADO: ['ENTREGADO', 'CANCELADO'],
  ENTREGADO: ['REEMBOLSADO'],
  CANCELADO: [],
  REEMBOLSADO: [],
  RECLAMO_ABIERTO: [],
  CERRADO_CON_DEVOLUCION: [],
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);

const formatDate = (value: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatLocalDate = (value: string): string => {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date);
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Ocurrió un error inesperado. Intentá nuevamente.';

const isCriticalTransition = (status: SaleStatus): boolean =>
  status === 'CANCELADO' || status === 'ENTREGADO' || status === 'REEMBOLSADO';

const hasInvoice = (receipts: FiscalReceiptResponse[]): boolean =>
  receipts.some((receipt) => receipt.receiptType === 'FACTURA_C');

const AdminSaleDetailModal = ({
  saleId,
  onClose,
  onUpdated,
}: AdminSaleDetailModalProps) => {
  const [sale, setSale] = useState<SaleResponse | null>(null);
  const [receipts, setReceipts] = useState<FiscalReceiptResponse[]>([]);
  const [changeReason, setChangeReason] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [fiscalName, setFiscalName] = useState('');
  const [fiscalType, setFiscalType] = useState<TaxIdType | ''>('');
  const [fiscalNumber, setFiscalNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadData = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError('');
    try {
      const [saleDetail, fiscalReceipts] = await Promise.all([
        getAdminSaleDetail(saleId),
        getFiscalReceiptsBySale(saleId),
      ]);
      setSale(saleDetail);
      setReceipts(fiscalReceipts);
      setInternalNotes(saleDetail.internalNotes ?? '');
      setFiscalName(saleDetail.customerName);
      setFiscalType(saleDetail.customerTaxIdType ?? '');
      setFiscalNumber(saleDetail.customerTaxIdNumber ?? '');
      return true;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      return false;
    } finally {
      setLoading(false);
    }
  }, [saleId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  const runUpdate = async (action: () => Promise<SaleResponse>): Promise<boolean> => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updatedSale = await action();
      setSale(updatedSale);
      setInternalNotes(updatedSale.internalNotes ?? '');
      onUpdated?.();
      return true;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaleStatus = async (newStatus: SaleStatus) => {
    if (!sale) return;
    if (isCriticalTransition(newStatus)
      && !window.confirm(`¿Confirmás el cambio de estado a ${SALE_STATUS_LABELS[newStatus]}?`)) {
      return;
    }
    const updated = await runUpdate(() => updateAdminSaleStatus(sale.saleId, {
      newStatus,
      ...(changeReason.trim() ? { changeReason: changeReason.trim() } : {}),
    }));
    if (updated) setChangeReason('');
  };

  const handlePaymentStatus = async (newPaymentStatus: PaymentStatus) => {
    if (!sale) return;
    if (newPaymentStatus === 'REEMBOLSADO'
      && !window.confirm('¿Confirmás marcar el pago como reembolsado?')) {
      return;
    }
    const updated = await runUpdate(() => updateAdminPaymentStatus(sale.saleId, {
      newPaymentStatus,
      ...(paymentNotes.trim() ? { paymentNotes: paymentNotes.trim() } : {}),
    }));
    if (updated) setPaymentNotes('');
  };

  const handleFiscalData = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sale) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updatedSale = await updateAdminSaleFiscalData(sale.saleId, {
        customerName: fiscalName.trim(),
        customerTaxIdType: fiscalType || null,
        customerTaxIdNumber: fiscalNumber.trim() || null,
      });
      setSale(updatedSale);
      setFiscalName(updatedSale.customerName);
      setFiscalType(updatedSale.customerTaxIdType ?? '');
      setFiscalNumber(updatedSale.customerTaxIdNumber ?? '');
      setNotice('Los datos fiscales se guardaron correctamente.');
      onUpdated?.();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sale) return;
    if (await runUpdate(() => updateAdminSaleNotes(sale.saleId, { internalNotes }))) {
      setNotice('Las notas internas se guardaron correctamente.');
    }
  };

  const handleRetryInvoice = async () => {
    if (!sale || !sale.fiscalRejection) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await retryRejectedInvoice(sale.saleId);
      if (await loadData()) {
        setNotice('Se completó el reintento de emisión en ARCA.');
        onUpdated?.();
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const handleCopyQr = async (payload: string) => {
    try {
      await navigator.clipboard.writeText(payload);
      setNotice('El contenido QR se copió al portapapeles.');
      setError('');
    } catch (clipboardError) {
      setError(getErrorMessage(clipboardError));
    }
  };

  const invoiceExists = hasInvoice(receipts);
  const showRejectedInvoiceCase = sale?.fiscalRejection === true && !invoiceExists;
  const showPendingInvoiceCase = sale?.paymentStatus === 'APROBADO'
    && sale.fiscalRejection === false
    && !invoiceExists;

  return (
    <div
      className="my-orders__modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        className="my-orders__modal my-orders__modal--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-sale-detail-title"
      >
        <header className="my-orders__modal-header">
          <div>
            <p className="my-orders__eyebrow mb-1">Gestión de venta</p>
            <h2 className="my-orders__modal-title" id="admin-sale-detail-title">
              {sale ? `Venta #${sale.saleId.slice(-8).toUpperCase()}` : 'Detalle de venta'}
            </h2>
          </div>
          <button type="button" className="my-orders__icon-button" onClick={onClose} aria-label="Cerrar detalle">
            ×
          </button>
        </header>

        <div className="my-orders__modal-body">
          {loading && <p role="status">Cargando venta y comprobantes…</p>}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {notice && <div className="alert alert-success" role="status">{notice}</div>}

          {sale && !loading && (
            <>
              <section className="my-orders__detail-section" aria-labelledby="admin-sale-summary-title">
                <h3 className="my-orders__section-title" id="admin-sale-summary-title">1. Cliente, entrega y renglones</h3>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <h4 className="h6">Comprador</h4>
                    <p className="mb-1"><strong>{sale.customerName}</strong></p>
                    <p className="mb-1">{sale.customerEmail}</p>
                    <p className="mb-1">{sale.customerPhone || 'Sin teléfono'}</p>
                    <p className="mb-1">
                      Documento: {sale.customerTaxIdType ?? 'Sin identificar'}
                      {sale.customerTaxIdNumber ? ` · ${sale.customerTaxIdNumber}` : ''}
                    </p>
                    <p className="text-muted mb-0">{sale.customerNotes || 'Sin notas del comprador'}</p>
                  </div>
                  <div className="col-12 col-md-6">
                    <h4 className="h6">Entrega</h4>
                    <p className="mb-1"><strong>{SHIPPING_METHOD_LABELS[sale.shippingMethod]}</strong></p>
                    <p className="mb-1">{sale.shippingAddress || 'Sin dirección registrada'}</p>
                    <p className="text-muted mb-1">
                      {[sale.shippingLocality, sale.shippingProvince, sale.shippingPostalCode]
                        .filter(Boolean)
                        .join(', ') || 'Sin localidad ni código postal'}
                    </p>
                    <p className="mb-0">Creada: {formatDate(sale.createdAt)}</p>
                    <p className="mb-0">Enviada: {formatDate(sale.saleShippedAt)}</p>
                    <p className="mb-0">Entregada: {formatDate(sale.saleDeliveredAt)}</p>
                  </div>
                </div>
                <h4 className="h6 mt-4">Ítems</h4>
                <div className="table-responsive">
                  <table className="table table-sm table-striped align-middle">
                    <thead>
                      <tr><th>Producto / SKU</th><th>Talle</th><th>Color</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                      {sale.items.map((item) => (
                        <tr key={item.saleItemId}>
                          <td>{item.productName}<br /><small className="text-muted">{item.variantSku || 'Sin SKU'}</small></td>
                          <td>{item.variantSize || '—'}</td>
                          <td>{item.colorName || '—'}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.unitPrice)}</td>
                          <td>{formatCurrency(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="my-orders__detail-section" aria-labelledby="admin-sale-status-title">
                <h3 className="my-orders__section-title" id="admin-sale-status-title">2. Estado logístico</h3>
                <p>
                  Estado actual:{' '}
                  <span className="badge text-bg-primary">{SALE_STATUS_LABELS[sale.saleStatus]}</span>
                </p>
                <label className="form-label" htmlFor="admin-sale-change-reason">Motivo del cambio (opcional)</label>
                <input
                  id="admin-sale-change-reason"
                  className="form-control mb-3"
                  maxLength={500}
                  value={changeReason}
                  onChange={(event) => setChangeReason(event.target.value)}
                />
                <div className="d-flex flex-wrap gap-2">
                  {VALID_TRANSITIONS[sale.saleStatus].map((status) => (
                    <button
                      type="button"
                      key={status}
                      className={`btn ${isCriticalTransition(status) ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                      disabled={saving}
                      onClick={() => void handleSaleStatus(status)}
                    >
                      {SALE_STATUS_LABELS[status]}
                    </button>
                  ))}
                  {VALID_TRANSITIONS[sale.saleStatus].length === 0 && (
                    <span className="text-muted">No hay transiciones logísticas disponibles.</span>
                  )}
                </div>
              </section>

              <section className="my-orders__detail-section" aria-labelledby="admin-sale-payment-title">
                <h3 className="my-orders__section-title" id="admin-sale-payment-title">3. Conciliación manual de pago</h3>
                <p>
                  {sale.paymentMethod} · <span className="badge text-bg-secondary">{PAYMENT_STATUS_LABELS[sale.paymentStatus]}</span>
                </p>
                {(sale.paymentMethod !== 'MERCADO_PAGO' && sale.paymentStatus === 'PENDIENTE')
                  || sale.paymentStatus === 'APROBADO' ? (
                    <>
                      <label className="form-label" htmlFor="admin-sale-payment-notes">Nota de pago (opcional)</label>
                      <input
                        id="admin-sale-payment-notes"
                        className="form-control mb-3"
                        maxLength={500}
                        value={paymentNotes}
                        onChange={(event) => setPaymentNotes(event.target.value)}
                      />
                      <div className="d-flex flex-wrap gap-2">
                        {sale.paymentMethod !== 'MERCADO_PAGO' && sale.paymentStatus === 'PENDIENTE' && (
                          <>
                            <button type="button" className="btn btn-outline-success" disabled={saving} onClick={() => void handlePaymentStatus('APROBADO')}>Marcar aprobado</button>
                            <button type="button" className="btn btn-outline-danger" disabled={saving} onClick={() => void handlePaymentStatus('RECHAZADO')}>Marcar rechazado</button>
                          </>
                        )}
                        {sale.paymentStatus === 'APROBADO' && (
                          <button type="button" className="btn btn-outline-danger" disabled={saving} onClick={() => void handlePaymentStatus('REEMBOLSADO')}>Marcar reembolsado</button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted mb-0">No hay acciones manuales disponibles para este método y estado de pago.</p>
                  )}
              </section>

              <section className="my-orders__detail-section" aria-labelledby="admin-sale-fiscal-title">
                <h3 className="my-orders__section-title" id="admin-sale-fiscal-title">4. Facturación electrónica ARCA</h3>
                {receipts.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle">
                      <thead>
                        <tr><th>Tipo</th><th>Comprobante</th><th>CAE</th><th>Vencimiento</th><th>Emisión</th><th>Total</th><th>QR</th></tr>
                      </thead>
                      <tbody>
                        {receipts.map((receipt) => (
                          <tr key={receipt.fiscalReceiptId}>
                            <td>{receipt.receiptType}</td>
                            <td>{receipt.formattedReceiptNumber}</td>
                            <td>{receipt.cae}</td>
                            <td>{formatLocalDate(receipt.caeDueDate)}</td>
                            <td>{formatLocalDate(receipt.issueDate)}</td>
                            <td>{formatCurrency(receipt.totalAmount)}</td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {/^https?:\/\//i.test(receipt.qrPayload) && (
                                  <a className="btn btn-sm btn-outline-primary" href={receipt.qrPayload} target="_blank" rel="noreferrer">Abrir</a>
                                )}
                                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void handleCopyQr(receipt.qrPayload)}>Copiar</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="text-muted">Todavía no hay comprobantes fiscales emitidos.</p>}

                {showRejectedInvoiceCase && (
                  <div className="mt-3">
                    <div className="alert alert-danger" role="alert">
                      <strong>ARCA rechazó la emisión por datos del receptor.</strong>
                      <span className="d-block">El scheduler no volverá a intentarlo automáticamente hasta que se corrijan los datos fiscales.</span>
                    </div>
                    <form className="card card-body mb-3" onSubmit={(event) => void handleFiscalData(event)}>
                      <h4 className="h6">Corrección de Datos Fiscales</h4>
                      <div className="row g-3">
                        <div className="col-12">
                          <label className="form-label" htmlFor="admin-sale-fiscal-name">Nombre o razón social</label>
                          <input
                            id="admin-sale-fiscal-name"
                            className="form-control"
                            maxLength={255}
                            required
                            value={fiscalName}
                            onChange={(event) => setFiscalName(event.target.value)}
                          />
                        </div>
                        <div className="col-12 col-md-5">
                          <label className="form-label" htmlFor="admin-sale-fiscal-type">Tipo de documento</label>
                          <select
                            id="admin-sale-fiscal-type"
                            className="form-select"
                            value={fiscalType}
                            onChange={(event) => setFiscalType(event.target.value as TaxIdType | '')}
                          >
                            <option value="">Sin identificar</option>
                            <option value="DNI">DNI</option>
                            <option value="CUIT">CUIT</option>
                            <option value="CUIL">CUIL</option>
                          </select>
                        </div>
                        <div className="col-12 col-md-7">
                          <label className="form-label" htmlFor="admin-sale-fiscal-number">Número de documento fiscal</label>
                          <input
                            id="admin-sale-fiscal-number"
                            className="form-control"
                            maxLength={20}
                            value={fiscalNumber}
                            onChange={(event) => setFiscalNumber(event.target.value)}
                          />
                        </div>
                      </div>
                      {sale.userId != null && (
                        <p className="form-text mb-0 mt-2">
                          Al guardar, cualquier cambio en el tipo o número de documento también se actualizará automáticamente en el perfil del usuario registrado.
                        </p>
                      )}
                      <div className="mt-3">
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                          {saving ? 'Guardando…' : 'Guardar corrección fiscal'}
                        </button>
                      </div>
                    </form>
                    <button
                      type="button"
                      className="btn btn-danger"
                      disabled={!sale.fiscalRejection || saving}
                      onClick={() => void handleRetryInvoice()}
                    >
                      {saving ? 'Procesando…' : 'Reintentar emisión en ARCA'}
                    </button>
                  </div>
                )}

                {showPendingInvoiceCase && (
                  <div className="alert alert-info mb-0" role="status">
                    Factura C pendiente de emisión automática (ARCA temporalmente no disponible — reintento programado cada 15 min por scheduler)
                  </div>
                )}
              </section>

              <section className="my-orders__detail-section" aria-labelledby="admin-sale-notes-title">
                <h3 className="my-orders__section-title" id="admin-sale-notes-title">5. Notas internas</h3>
                <form onSubmit={(event) => void handleSaveNotes(event)}>
                  <label className="form-label" htmlFor="admin-sale-internal-notes">Notas internas de la venta</label>
                  <textarea
                    id="admin-sale-internal-notes"
                    className="form-control"
                    rows={4}
                    maxLength={2000}
                    value={internalNotes}
                    onChange={(event) => setInternalNotes(event.target.value)}
                  />
                  <button type="submit" className="btn btn-primary mt-3" disabled={saving}>
                    {saving ? 'Guardando…' : 'Guardar notas internas'}
                  </button>
                </form>
              </section>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminSaleDetailModal;
