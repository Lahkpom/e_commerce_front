import { useEffect, useState, type FormEvent } from 'react';
import {
  getAdminReturnDetail,
  inspectAdminReturn,
  processAdminReturnRefund,
  updateAdminReturnStatus,
} from '../../../services/adminReturnService';
import { getAdminSaleDetail } from '../../../services/adminSaleService';
import type {
  ReturnReason,
  ReturnResolution,
  ReturnStatus,
  SaleReturnInspectionRequest,
  SaleReturnResponse,
} from '../../../types/saleReturn';
import type { PaymentMethod, PaymentStatus } from '../../../types/sale';
import styles from './AdminReturnDetailModal.module.scss';

interface AdminReturnDetailModalProps {
  returnId: string;
  onClose: () => void;
  onUpdated: () => void;
}

interface ItemDecision {
  returnItemId: number;
  restockApproved: boolean | null;
  rejectionReason: string;
}

const REASON_LABELS: Record<ReturnReason, string> = {
  ARREPENTIMIENTO_LEGAL: 'Arrepentimiento legal',
  CAMBIO_TALLE: 'Cambio de talle',
  DEFECTO_FABRICACION: 'Defecto de fabricación',
};

const RESOLUTION_LABELS: Record<ReturnResolution, string> = {
  REEMBOLSO_DINERO: 'Reembolso de dinero',
  CAMBIO_PRODUCTO: 'Cambio de producto',
  CREDITO_TIENDA: 'Crédito en tienda',
};

const STATUS_LABELS: Record<ReturnStatus, string> = {
  SOLICITADA: 'Solicitada',
  EN_TRANSITO: 'En tránsito',
  RECIBIDO_EN_CONTROL: 'Recibida en control',
  APROBADA: 'Aprobada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
};

const TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  SOLICITADA: ['EN_TRANSITO', 'RECIBIDO_EN_CONTROL', 'CANCELADA'],
  EN_TRANSITO: ['RECIBIDO_EN_CONTROL', 'CANCELADA'],
  RECIBIDO_EN_CONTROL: [],
  APROBADA: [],
  RECHAZADA: [],
  CANCELADA: [],
};

const formatCurrency = (value: number | null): string =>
  value === null ? '—' : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

const formatDate = (value: string | null): string => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible'
    : new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'No se pudo completar la operación.';

const AdminReturnDetailModal = ({ returnId, onClose, onUpdated }: AdminReturnDetailModalProps) => {
  const [detail, setDetail] = useState<SaleReturnResponse | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [targetStatus, setTargetStatus] = useState<ReturnStatus | ''>('');
  const [returnShippingGuide, setReturnShippingGuide] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [inspectionEvidencePath, setInspectionEvidencePath] = useState('');
  const [decisions, setDecisions] = useState<ItemDecision[]>([]);
  const [transactionReference, setTransactionReference] = useState('');
  const [refundNotes, setRefundNotes] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getAdminReturnDetail(returnId)
      .then((response) => Promise.all([response, getAdminSaleDetail(response.saleId)]))
      .then(([response, sale]) => {
        if (!active) return;
        setDetail(response);
        setPaymentMethod(sale.paymentMethod);
        setPaymentStatus(sale.paymentStatus);
        setReturnShippingGuide(response.returnShippingGuide ?? '');
        setInspectionNotes(response.inspectionNotes ?? '');
        setInspectionEvidencePath(response.inspectionEvidencePath ?? '');
        setDecisions(response.items.map((item) => ({
          returnItemId: item.returnItemId,
          restockApproved: item.restockApproved,
          rejectionReason: item.rejectionReason ?? '',
        })));
      })
      .catch((requestError: unknown) => {
        if (active) setError(errorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [returnId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  const runAction = async (action: () => Promise<SaleReturnResponse>, successMessage: string): Promise<boolean> => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const updated = await action();
      setDetail(updated);
      setReturnShippingGuide(updated.returnShippingGuide ?? '');
      setInspectionNotes(updated.inspectionNotes ?? '');
      setInspectionEvidencePath(updated.inspectionEvidencePath ?? '');
      setDecisions(updated.items.map((item) => ({
        returnItemId: item.returnItemId,
        restockApproved: item.restockApproved,
        rejectionReason: item.rejectionReason ?? '',
      })));
      setNotice(successMessage);
      onUpdated();
      return true;
    } catch (requestError) {
      setError(errorMessage(requestError));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail || !targetStatus) return;
    await runAction(
      () => updateAdminReturnStatus(detail.returnId, {
        newStatus: targetStatus,
        ...(returnShippingGuide.trim() ? { returnShippingGuide: returnShippingGuide.trim() } : {}),
        ...(statusNotes.trim() ? { statusNotes: statusNotes.trim() } : {}),
      }),
      'El estado y los datos logísticos se actualizaron.',
    );
    setTargetStatus('');
    setStatusNotes('');
  };

  const handleInspection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail) return;
    if (!inspectionNotes.trim()) {
      setError('Ingresá el dictamen general del peritaje.');
      return;
    }
    if (decisions.some((decision) => decision.restockApproved === null)) {
      setError('Seleccioná el dictamen de cada ítem antes de guardar el peritaje.');
      return;
    }
    const payload: SaleReturnInspectionRequest = {
      inspectionNotes: inspectionNotes.trim(),
      ...(inspectionEvidencePath.trim() ? { inspectionEvidencePath: inspectionEvidencePath.trim() } : {}),
      inspectedItems: decisions.map((decision) => ({
        returnItemId: decision.returnItemId,
        restockApproved: decision.restockApproved === true,
        ...(decision.rejectionReason.trim() ? { rejectionReason: decision.rejectionReason.trim() } : {}),
      })),
    };
    await runAction(
      () => inspectAdminReturn(detail.returnId, payload),
      'El peritaje se registró correctamente.',
    );
  };

  const handleRefund = async () => {
    if (!detail) return;
    if (paymentMethod !== 'MERCADO_PAGO' && !transactionReference.trim()) {
      setError('Ingresá el comprobante de la transferencia de reintegro para conciliar el reembolso.');
      return;
    }
    if (!window.confirm('¿Confirmás procesar el reembolso de esta devolución?')) return;
    const processed = await runAction(
      () => processAdminReturnRefund(detail.returnId, {
        ...(transactionReference.trim() ? { transactionReference: transactionReference.trim() } : {}),
        ...(refundNotes.trim() ? { notes: refundNotes.trim() } : {}),
      }),
      'El reembolso se procesó correctamente.',
    );
    if (processed) setPaymentStatus('REEMBOLSADO');
  };

  const updateDecision = (returnItemId: number, patch: Partial<ItemDecision>) => {
    setDecisions((current) => current.map((item) =>
      item.returnItemId === returnItemId ? { ...item, ...patch } : item));
  };

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !saving) onClose();
    }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="admin-return-title">
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>Gestión de posventa</p>
            <h2 id="admin-return-title">{detail ? `Devolución #${detail.returnId.slice(-8).toUpperCase()}` : 'Detalle de devolución'}</h2>
          </div>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar detalle">×</button>
        </header>

        <div className={styles.body}>
          {loading && <p role="status">Cargando expediente…</p>}
          {error && <div className="alert alert-danger" role="alert">{error}</div>}
          {notice && <div className="alert alert-success" role="status">{notice}</div>}
          {detail && !loading && (
            <>
              <section className={styles.customer}>
                <div className={styles.summary}>
                  <p><strong>Orden:</strong> #{detail.saleId.slice(-8).toUpperCase()}</p>
                  <p><strong>Estado:</strong> {STATUS_LABELS[detail.returnStatus]}</p>
                  <p><strong>Motivo:</strong> {REASON_LABELS[detail.returnReason]}</p>
                  <p><strong>Resolución solicitada:</strong> {RESOLUTION_LABELS[detail.returnResolution]}</p>
                  <p><strong>Solicitada:</strong> {formatDate(detail.createdAt)}</p>
                  <p><strong>Monto de reembolso:</strong> {formatCurrency(detail.refundAmount)}</p>
                </div>
                <h3>Comentario literal del cliente</h3>
                <blockquote>{detail.customerNotes || 'Sin comentario del cliente.'}</blockquote>
              </section>

              <section>
                <h3>Ítems reclamados</h3>
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead><tr><th>Producto</th><th>Variante</th><th>Cantidad</th><th>Subtotal</th><th>Inspección</th></tr></thead>
                    <tbody>
                      {detail.items.map((item) => (
                        <tr key={item.returnItemId}>
                          <td>{item.productName}<small className="d-block text-muted">{item.variantSku ?? 'Sin SKU'}</small></td>
                          <td>{[item.variantSize, item.colorName].filter(Boolean).join(' · ') || '—'}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.subtotal)}</td>
                          <td>{item.restockApproved === null ? 'Pendiente' : item.restockApproved ? 'Apto para stock' : `No apto${item.rejectionReason ? `: ${item.rejectionReason}` : ''}`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {detail.returnShippingGuide && <p><strong>Guía de devolución:</strong> {detail.returnShippingGuide}</p>}
                {detail.inspectionNotes && <p className={styles.notes}><strong>Notas de inspección / resolución:</strong><br />{detail.inspectionNotes}</p>}
              </section>

              {TRANSITIONS[detail.returnStatus].length > 0 && (
                <form className={styles.actionPanel} onSubmit={(event) => void handleStatusUpdate(event)}>
                  <h3>Actualizar estado y guía</h3>
                  <label>
                    Nuevo estado
                    <select required value={targetStatus} onChange={(event) => setTargetStatus(event.target.value as ReturnStatus | '')}>
                      <option value="">Seleccionar estado</option>
                      {TRANSITIONS[detail.returnStatus].map((status) => <option value={status} key={status}>{STATUS_LABELS[status]}</option>)}
                    </select>
                  </label>
                  <label>
                    Guía de retiro / devolución
                    <input maxLength={100} value={returnShippingGuide} onChange={(event) => setReturnShippingGuide(event.target.value)} />
                  </label>
                  <label>
                    Nota del cambio
                    <textarea maxLength={500} rows={2} value={statusNotes} onChange={(event) => setStatusNotes(event.target.value)} />
                  </label>
                  <button type="submit" className="btn btn-primary" disabled={saving || !targetStatus}>
                    {saving ? 'Guardando…' : 'Guardar actualización'}
                  </button>
                </form>
              )}

              {detail.returnStatus === 'RECIBIDO_EN_CONTROL' && (
                <form className={styles.actionPanel} onSubmit={(event) => void handleInspection(event)}>
                  <h3>Peritaje por ítem</h3>
                  {detail.items.map((item) => {
                    const decision = decisions.find((entry) => entry.returnItemId === item.returnItemId);
                    return (
                      <fieldset className={styles.itemDecision} key={item.returnItemId}>
                        <legend>{item.productName} · {item.quantity} unidad(es)</legend>
                        <label>
                          Dictamen
                          <select
                            required
                            value={decision?.restockApproved === null || decision?.restockApproved === undefined
                              ? ''
                              : String(decision.restockApproved)}
                            onChange={(event) => updateDecision(item.returnItemId, {
                              restockApproved: event.target.value === '' ? null : event.target.value === 'true',
                            })}
                          >
                            <option value="">Seleccionar</option>
                            <option value="true">Apto para reingreso a stock</option>
                            <option value="false">No apto para reingreso</option>
                          </select>
                        </label>
                        {decision?.restockApproved === false && (
                          <label>
                            Motivo de rechazo (opcional)
                            <input maxLength={255} value={decision.rejectionReason}
                              onChange={(event) => updateDecision(item.returnItemId, { rejectionReason: event.target.value })} />
                          </label>
                        )}
                      </fieldset>
                    );
                  })}
                  <label>
                    Dictamen general
                    <textarea required maxLength={1000} rows={3} value={inspectionNotes}
                      onChange={(event) => setInspectionNotes(event.target.value)} />
                  </label>
                  <label>
                    Ruta de evidencias (opcional)
                    <input maxLength={500} value={inspectionEvidencePath}
                      onChange={(event) => setInspectionEvidencePath(event.target.value)} />
                  </label>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Registrando…' : 'Registrar peritaje'}
                  </button>
                </form>
              )}

              {detail.returnStatus === 'APROBADA'
                && detail.returnResolution === 'REEMBOLSO_DINERO'
                && paymentStatus !== 'REEMBOLSADO'
                && (
                  <section className={styles.actionPanel}>
                    <h3>Procesar reembolso</h3>
                    <label>
                      Referencia de transacción{paymentMethod === 'MERCADO_PAGO' ? ' (opcional)' : ' (obligatoria)'}
                      <input maxLength={100} value={transactionReference}
                        onChange={(event) => setTransactionReference(event.target.value)} />
                    </label>
                    <label>
                      Notas de conciliación
                      <textarea maxLength={500} rows={2} value={refundNotes}
                        onChange={(event) => setRefundNotes(event.target.value)} />
                    </label>
                    <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void handleRefund()}>
                      {saving ? 'Procesando…' : 'Procesar reembolso'}
                    </button>
                  </section>
                )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminReturnDetailModal;
