import { useEffect, useRef, useState } from 'react';
import useMainData from '../../hooks/useMainData';
import './BankTransferInstructionsCard.scss';

interface BankTransferInstructionsCardProps {
  saleId: string;
  saleTotal: number;
  paymentStatus: string;
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);

const BankTransferInstructionsCard = ({
  saleId,
  saleTotal,
  paymentStatus,
}: BankTransferInstructionsCardProps) => {
  const { globalInfo } = useMainData();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [copyError, setCopyError] = useState('');
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountDetails = [
    { key: 'entity', label: 'Entidad', value: import.meta.env.VITE_TRANSFER_ENTITY },
    { key: 'holder', label: 'Titular', value: import.meta.env.VITE_TRANSFER_ACCOUNT_HOLDER },
    { key: 'cuit', label: 'CUIT', value: import.meta.env.VITE_TRANSFER_CUIT },
    { key: 'alias', label: 'Alias', value: import.meta.env.VITE_TRANSFER_ALIAS },
    { key: 'cvu', label: 'CVU', value: import.meta.env.VITE_TRANSFER_CVU },
  ];
  const whatsappNumber = globalInfo.phoneNumber.replace(/\D/g, '');
  const whatsappMessage = `Hola, envío el comprobante de transferencia de la orden ${saleId} por ${formatCurrency(saleTotal)}.`;
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  useEffect(() => () => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
  }, []);

  const handleCopy = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setCopyError('');
      if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
      feedbackTimeout.current = setTimeout(() => setCopiedField(null), 1800);
    } catch (error) {
      setCopyError(error instanceof Error ? error.message : 'No se pudo copiar al portapapeles.');
      setCopiedField(null);
    }
  };

  return (
    <section className="bank-transfer-card" aria-labelledby="bank-transfer-title">
      <header className="bank-transfer-card__header">
        <p className="bank-transfer-card__eyebrow">Un último paso</p>
        <h2 id="bank-transfer-title">Transferencia bancaria</h2>
        <p>Realizá la transferencia para que podamos preparar tu pedido.</p>
      </header>

      <p className="bank-transfer-card__amount-label">Monto exacto a transferir</p>
      <p className="bank-transfer-card__amount">{formatCurrency(saleTotal)}</p>

      <dl className="bank-transfer-card__details">
        {accountDetails.map(({ key, label, value }) => (
          <div className="bank-transfer-card__detail" key={key}>
            <dt>{label}</dt>
            <dd>
              <span>{value}</span>
              <button
                type="button"
                className="bank-transfer-card__copy"
                onClick={() => void handleCopy(key, value)}
                aria-label={`Copiar ${label}`}
              >
                {copiedField === key ? '¡Copiado!' : 'Copiar'}
              </button>
            </dd>
          </div>
        ))}
      </dl>

      <div className="bank-transfer-card__reference">
        <div>
          <strong>Número de referencia obligatorio</strong>
          <span>Incluí este código en el concepto de la transferencia.</span>
          <code>{saleId}</code>
        </div>
        <button
          type="button"
          className="bank-transfer-card__copy"
          onClick={() => void handleCopy('saleId', saleId)}
        >
          {copiedField === 'saleId' ? '¡Copiado!' : 'Copiar referencia'}
        </button>
      </div>

      <p className="bank-transfer-card__notice" role="status">
        El pago debe acreditarse dentro de las 72 hs. La orden vence si no se acredita dentro de ese plazo.
        Estado actual: {paymentStatus}.
      </p>
      {copyError && <p className="bank-transfer-card__error" role="alert">{copyError}</p>}

      <a
        className="bank-transfer-card__whatsapp"
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
      >
        Enviar comprobante por WhatsApp
      </a>
    </section>
  );
};

export default BankTransferInstructionsCard;
