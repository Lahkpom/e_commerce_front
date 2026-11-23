import { useCallback, useEffect, useState } from 'react';
import { searchAdminReturns } from '../../../services/adminReturnService';
import type { ReturnReason, ReturnStatus, SaleReturnSummaryResponse } from '../../../types/saleReturn';
import AdminReturnDetailModal from './AdminReturnDetailModal';
import AdminReturnsTable from './AdminReturnsTable';
import styles from './AdminReturnsManager.module.scss';

const RETURN_STATUSES: ReturnStatus[] = [
  'SOLICITADA',
  'EN_TRANSITO',
  'RECIBIDO_EN_CONTROL',
  'APROBADA',
  'RECHAZADA',
  'CANCELADA',
];

const RETURN_REASONS: ReturnReason[] = [
  'ARREPENTIMIENTO_LEGAL',
  'CAMBIO_TALLE',
  'DEFECTO_FABRICACION',
];

const AdminReturnsManager = () => {
  const [returns, setReturns] = useState<SaleReturnSummaryResponse[]>([]);
  const [returnStatus, setReturnStatus] = useState<ReturnStatus | ''>('');
  const [returnReason, setReturnReason] = useState<ReturnReason | ''>('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const loadReturns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await searchAdminReturns({
        ...(returnStatus ? { returnStatus } : {}),
        ...(returnReason ? { returnReason } : {}),
        ...(customerEmail.trim() ? { customerEmail: customerEmail.trim() } : {}),
        page,
        size: 15,
      });
      setReturns(result.content);
      setPageCount(result.page.totalPages);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las devoluciones.');
    } finally {
      setLoading(false);
    }
  }, [customerEmail, page, refreshKey, returnReason, returnStatus]);

  useEffect(() => {
    void loadReturns();
  }, [loadReturns]);

  const applyFilter = () => {
    setPage(0);
    setRefreshKey((current) => current + 1);
  };

  const refresh = () => setRefreshKey((current) => current + 1);

  return (
    <section className={styles.manager}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Panel de operaciones</p>
          <h1>Devoluciones</h1>
          <p>Seguimiento, inspección y conciliación de solicitudes de posventa.</p>
        </div>
      </header>

      <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); applyFilter(); }}>
        <label>
          Estado
          <select value={returnStatus} onChange={(event) => setReturnStatus(event.target.value as ReturnStatus | '')}>
            <option value="">Todos</option>
            {RETURN_STATUSES.map((status) => <option value={status} key={status}>{status.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
        <label>
          Motivo
          <select value={returnReason} onChange={(event) => setReturnReason(event.target.value as ReturnReason | '')}>
            <option value="">Todos</option>
            {RETURN_REASONS.map((reason) => <option value={reason} key={reason}>{reason.replace(/_/g, ' ')}</option>)}
          </select>
        </label>
        <label className={styles.emailFilter}>
          Email del cliente
          <input type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
        </label>
        <button type="submit" className="btn btn-primary">Filtrar</button>
      </form>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <AdminReturnsTable returns={returns} loading={loading} onSelect={setSelectedReturnId} />

      <div className={styles.pagination}>
        <span>{returns.length} solicitudes · Página {pageCount === 0 ? 0 : page + 1} de {pageCount}</span>
        <div>
          <button type="button" className="btn btn-outline-secondary" disabled={page === 0 || loading}
            onClick={() => setPage((current) => Math.max(0, current - 1))}>Anterior</button>
          <button type="button" className="btn btn-outline-secondary" disabled={loading || pageCount === 0 || page + 1 >= pageCount}
            onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>Siguiente</button>
        </div>
      </div>

      {selectedReturnId && (
        <AdminReturnDetailModal
          returnId={selectedReturnId}
          onClose={() => setSelectedReturnId(null)}
          onUpdated={refresh}
        />
      )}
    </section>
  );
};

export default AdminReturnsManager;
