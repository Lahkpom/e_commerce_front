import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { retryMercadoPagoPayment } from '../../services/saleService';
import styles from './CheckoutResultStatus.module.scss';

export type CheckoutResultStatusType = 'success' | 'pending' | 'failure';

interface CheckoutResultStatusProps {
  status: CheckoutResultStatusType;
}

const CONTENT: Record<CheckoutResultStatusType, { title: string; message: string; detail: string }> = {
  success: {
    title: '¡Pago acreditado!',
    message: 'Mercado Pago confirmó tu pago.',
    detail: 'Te enviaremos las novedades del envío y el comprobante a los datos de contacto de tu compra.',
  },
  pending: {
    title: 'Pago pendiente de acreditación',
    message: 'El pago está en revisión o todavía no se acreditó.',
    detail: 'Podés consultar el estado actualizado de tu orden desde tus compras.',
  },
  failure: {
    title: 'No se pudo completar el pago',
    message: 'El pago fue rechazado o cancelado.',
    detail: 'Podés volver a Mercado Pago para intentar completar el pago de esta orden.',
  },
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'No se pudo iniciar el reintento de pago.';

const CheckoutResultStatus = ({ status }: CheckoutResultStatusProps) => {
  const [searchParams] = useSearchParams();
  const saleId = searchParams.get('saleId') || searchParams.get('external_reference');
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState('');
  const content = CONTENT[status];

  const handleRetry = async () => {
    if (!saleId) return;
    setRetrying(true);
    setError('');
    try {
      const sale = await retryMercadoPagoPayment(saleId);
      if (!sale.mpInitPoint) {
        throw new Error('Mercado Pago no devolvió un enlace para completar el pago.');
      }
      window.location.assign(sale.mpInitPoint);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setRetrying(false);
    }
  };

  return (
    <main className={`${styles.result} ${styles[status]}`}>
      <section className={styles.card} aria-labelledby="checkout-result-title">
        <div className={styles.icon} aria-hidden="true">
          {status === 'success' ? '✓' : status === 'pending' ? '…' : '!'}
        </div>
        <p className={styles.eyebrow}>Estado de tu compra</p>
        <h1 id="checkout-result-title">{content.title}</h1>
        <p className={styles.message}>{content.message}</p>
        <p>{content.detail}</p>

        {saleId ? (
          <p className={styles.order}>
            Número de orden <strong>{saleId}</strong>
          </p>
        ) : (
          <p className={styles.order}>No recibimos un número de orden en el retorno.</p>
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.actions}>
          {status === 'failure' && (
            <button
              type="button"
              className={`${styles.button} ${styles.primary}`}
              disabled={!saleId || retrying}
              onClick={() => void handleRetry()}
            >
              {retrying ? 'Conectando con Mercado Pago…' : 'Reintentar pago con Mercado Pago'}
            </button>
          )}
          <Link className={`${styles.button} ${styles.secondary}`} to="/mi_cuenta/ordenes_activas">
            Ver mis compras
          </Link>
          {status === 'success' && (
            <Link className={styles.textLink} to="/productos">Seguir comprando</Link>
          )}
        </div>
      </section>
    </main>
  );
};

export default CheckoutResultStatus;
