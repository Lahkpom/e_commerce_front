import type { PaymentStatus, SaleStatus, SaleSummaryResponse } from '../../../types/sale';

interface SalesTableProps {
  sales: SaleSummaryResponse[];
  loading: boolean;
  onSelect: (saleId: string) => void;
}

const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  PENDIENTE: 'Pendiente', PREPARACION: 'En preparación', ENVIADO: 'Enviado', ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado', REEMBOLSADO: 'Reembolsado', AUDITORIA: 'Auditoría',
  RECLAMO_ABIERTO: 'Reclamo abierto', CERRADO_CON_DEVOLUCION: 'Cerrado con devolución',
};
const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', RECHAZADO: 'Rechazado',
  REEMBOLSO_PENDIENTE: 'Reembolso pendiente', REEMBOLSADO: 'Reembolsado',
};
const SHIPPING_METHOD_LABELS: Record<SaleSummaryResponse['shippingMethod'], string> = {
  RETIRO_LLAVALLOL: 'Retiro', ENVIO_GBA_ZONA_SUR: 'GBA Zona Sur',
  ENVIO_GBA_GENERAL: 'Envío GBA', ENVIO_CORREO_NACIONAL: 'Correo nacional',
};
const formatCurrency = (amount: number) => new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', minimumFractionDigits: 2,
}).format(amount);
const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible'
    : new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date);
};

const SalesTable = ({ sales, loading, onSelect }: SalesTableProps) => (
  <div className="card">
    <div className="table-responsive">
      <table className="table table-striped table-hover align-middle mb-0">
        <thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Envío</th><th>Método de pago</th><th>Pago</th><th>Estado de venta</th><th>Total</th><th>Acciones</th></tr></thead>
        <tbody>
          {loading ? <tr><td colSpan={9} className="py-4 text-center">Cargando ventas…</td></tr>
            : sales.length === 0 ? <tr><td colSpan={9} className="py-4 text-center">No hay ventas para mostrar.</td></tr>
              : sales.map((sale) => (
                <tr key={sale.saleId}>
                  <td><code>{sale.saleId.slice(-8).toUpperCase()}</code></td>
                  <td>{formatDate(sale.createdAt)}</td>
                  <td>{sale.customerName}<br /><small className="text-muted">{sale.customerEmail}</small></td>
                  <td>{SHIPPING_METHOD_LABELS[sale.shippingMethod]}</td>
                  <td>{sale.paymentMethod.replace(/_/g, ' ')}</td>
                  <td><span className="badge text-bg-secondary">{PAYMENT_STATUS_LABELS[sale.paymentStatus]}</span></td>
                  <td>
                    <span className={`badge ${sale.saleStatus === 'REEMBOLSADO' || sale.saleStatus === 'CERRADO_CON_DEVOLUCION' ? 'text-bg-warning' : 'text-bg-primary'}`}>
                      {SALE_STATUS_LABELS[sale.saleStatus]}
                    </span>
                    {(sale.saleStatus === 'REEMBOLSADO' || sale.saleStatus === 'CERRADO_CON_DEVOLUCION')
                      ? <small className="d-block text-warning-emphasis fw-semibold mt-1">Cierre por devolución / reembolso</small>
                      : (sale.saleStatus === 'ENTREGADO' || sale.saleStatus === 'CANCELADO')
                        ? <small className="d-block text-muted mt-1">Cierre normal</small>
                        : null}
                    {sale.fiscalRejection && <span className="badge text-bg-danger ms-1">ARCA Rechazada</span>}
                  </td>
                  <td>{formatCurrency(sale.saleTotal)}</td>
                  <td><button type="button" className="btn btn-sm btn-outline-primary"
                    title={`Ver detalle de venta ${sale.saleId.slice(-8).toUpperCase()}`}
                    aria-label={`Ver detalle de venta ${sale.saleId.slice(-8).toUpperCase()}`}
                    onClick={() => onSelect(sale.saleId)}><i className="bi bi-eye" aria-hidden="true" /></button></td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default SalesTable;
