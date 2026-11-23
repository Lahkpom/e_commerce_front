import type { ReturnReason, ReturnResolution, ReturnStatus, SaleReturnSummaryResponse } from '../../../types/saleReturn';
import styles from './AdminReturnsTable.module.scss';

interface AdminReturnsTableProps {
  returns: SaleReturnSummaryResponse[];
  loading: boolean;
  onSelect: (returnId: string) => void;
}

const REASON_LABELS: Record<ReturnReason, string> = {
  ARREPENTIMIENTO_LEGAL: 'Arrepentimiento legal',
  CAMBIO_TALLE: 'Cambio de talle',
  DEFECTO_FABRICACION: 'Defecto de fabricación',
};

const RESOLUTION_LABELS: Record<ReturnResolution, string> = {
  REEMBOLSO_DINERO: 'Reembolso',
  CAMBIO_PRODUCTO: 'Cambio',
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

const formatCurrency = (value: number | null): string =>
  value === null ? '—' : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible'
    : new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium' }).format(date);
};

const AdminReturnsTable = ({ returns, loading, onSelect }: AdminReturnsTableProps) => (
  <div className={`card ${styles.tableCard}`}>
    <div className="table-responsive">
      <table className="table table-striped table-hover align-middle mb-0">
        <thead>
          <tr><th>Solicitud</th><th>Fecha</th><th>Cliente</th><th>Motivo</th><th>Resolución</th><th>Estado</th><th>Reembolso</th><th /></tr>
        </thead>
        <tbody>
          {loading
            ? <tr><td colSpan={8} className="py-4 text-center">Cargando devoluciones…</td></tr>
            : returns.length === 0
              ? <tr><td colSpan={8} className="py-4 text-center">No hay devoluciones para los filtros seleccionados.</td></tr>
              : returns.map((returnCase) => (
                <tr key={returnCase.returnId}>
                  <td><code>#{returnCase.returnId.slice(-8).toUpperCase()}</code><small className="d-block text-muted">Orden #{returnCase.saleId.slice(-8).toUpperCase()}</small></td>
                  <td>{formatDate(returnCase.createdAt)}</td>
                  <td>{returnCase.customerName}<small className="d-block text-muted">{returnCase.customerEmail}</small></td>
                  <td>{REASON_LABELS[returnCase.returnReason]}</td>
                  <td>{RESOLUTION_LABELS[returnCase.returnResolution]}</td>
                  <td><span className={styles.status}>{STATUS_LABELS[returnCase.returnStatus]}</span></td>
                  <td>{formatCurrency(returnCase.refundAmount)}</td>
                  <td><button type="button" className="btn btn-sm btn-outline-primary"
                    onClick={() => onSelect(returnCase.returnId)}>Gestionar</button></td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AdminReturnsTable;
