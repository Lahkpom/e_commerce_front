import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  simulateMercadoPagoWebhook,
  type MercadoPagoSimulationOutcome,
} from '../../services/saleService';
import styles from './MercadoPagoSandbox.module.scss';

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);

const OUTCOMES: {
  value: MercadoPagoSimulationOutcome;
  label: string;
  destination: string;
  buttonStyle: string;
}[] = [
  {
    value: 'approved',
    label: 'Simular Pago Aprobado',
    destination: '/checkout/success',
    buttonStyle: 'approved',
  },
  {
    value: 'pending',
    label: 'Simular Pago Pendiente',
    destination: '/checkout/pending',
    buttonStyle: 'pending',
  },
  {
    value: 'rejected',
    label: 'Simular Rechazo / Error de Servidor',
    destination: '/checkout/failure',
    buttonStyle: 'rejected',
  },
];

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'No se pudo procesar la simulación.';

const MercadoPagoSandbox = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const saleId = searchParams.get('saleId') ?? '';
  const preferenceId = searchParams.get('preferenceId') ?? '';
  const amountText = searchParams.get('amount') ?? '';
  const amount = Number(amountText);
  const validContext = Boolean(saleId && preferenceId && amountText && Number.isFinite(amount));
  const [processing, setProcessing] = useState<MercadoPagoSimulationOutcome | null>(null);
  const [error, setError] = useState('');

  const handleSimulate = async (
    outcome: MercadoPagoSimulationOutcome,
    destination: string,
  ) => {
    if (!validContext || processing) return;
    setProcessing(outcome);
    setError('');
    try {
      const response = await simulateMercadoPagoWebhook(saleId, outcome);
      navigate(`${destination}?saleId=${encodeURIComponent(response.saleId)}`);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setProcessing(null);
    }
  };

  return (
    <main className={styles.sandbox}>
      <section className={styles.card} aria-labelledby="mp-sandbox-title">
        <p className={styles.eyebrow}>Checkout Pro · Sandbox</p>
        <h1 id="mp-sandbox-title">Simulador de Pasarela Mercado Pago (Entorno de Desarrollo)</h1>
        <p>Elegí un resultado para completar la simulación del pago de esta orden.</p>

        {validContext ? (
          <dl className={styles.details}>
            <div><dt>ID de la orden</dt><dd>{saleId}</dd></div>
            <div><dt>Referencia de preferencia</dt><dd>{preferenceId}</dd></div>
            <div><dt>Monto total</dt><dd>{formatCurrency(amount)}</dd></div>
          </dl>
        ) : (
          <p className={styles.error} role="alert">
            Faltan datos válidos de la orden para iniciar la simulación.
          </p>
        )}

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.actions}>
          {OUTCOMES.map(({ value, label, destination, buttonStyle }) => (
            <button
              key={value}
              type="button"
              className={`${styles.button} ${styles[`button${buttonStyle[0].toUpperCase()}${buttonStyle.slice(1)}`]}`}
              disabled={!validContext || processing !== null}
              onClick={() => void handleSimulate(value, destination)}
            >
              {processing === value ? 'Procesando pago…' : label}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
};

export default MercadoPagoSandbox;
