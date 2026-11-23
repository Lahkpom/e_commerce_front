import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useCart from '../../hooks/useCart';
import { createCheckout } from '../../services/saleService';
import { getLocalidadesByProvincia, getProvincias } from '../../services/georefService';
import type { GeoRefOption } from '../../services/georefService';
import { getShippingQuote } from '../../services/shippingService';
import type { CheckoutItemRequest, CheckoutRequest, PaymentMethod, SaleResponse } from '../../types/sale';
import type { ShippingQuoteResponse } from '../../types/shipping';
import type { CartItemResponse } from '../../types/cart';
import BankTransferInstructionsCard from './BankTransferInstructionsCard';
import './CheckoutForm.scss';

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'MERCADO_PAGO', label: 'Mercado Pago' },
  { value: 'TRANSFERENCIA', label: 'Transferencia bancaria' },
  { value: 'EFECTIVO', label: 'Efectivo al recibir o retirar' },
];

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(amount);

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Ocurrió un error inesperado. Intentá nuevamente.';

const CheckoutForm = () => {
  const navigate = useNavigate();
  const { cartItems, grandTotal, loading: cartLoading, clearCart } = useCart();
  const { user, profile } = useAuth();
  const items: CartItemResponse[] = cartItems;

  const [customerName, setCustomerName] = useState(profile?.userName ?? user?.userName ?? '');
  const [customerEmail, setCustomerEmail] = useState(user?.userEmail ?? '');
  const [customerPhone, setCustomerPhone] = useState(profile?.userPhone ?? user?.userPhone ?? '');
  const [isPickup, setIsPickup] = useState(true);
  const [provincias, setProvincias] = useState<GeoRefOption[]>([]);
  const [localidades, setLocalidades] = useState<GeoRefOption[]>([]);
  const [provinceId, setProvinceId] = useState('');
  const [localityId, setLocalityId] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MERCADO_PAGO');
  const [quote, setQuote] = useState<ShippingQuoteResponse | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [loadingProvincias, setLoadingProvincias] = useState(true);
  const [loadingLocalidades, setLoadingLocalidades] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<SaleResponse | null>(null);

  const provinceName = useMemo(
    () => provincias.find((province) => province.id === provinceId)?.nombre ?? '',
    [provincias, provinceId],
  );
  const localityName = useMemo(
    () => localidades.find((locality) => locality.id === localityId)?.nombre ?? '',
    [localidades, localityId],
  );
  const productsSubtotal = grandTotal;
  const allItemsAvailable = items.length > 0
    && items.every((item) => item.quantity <= item.currentAvailableStock);
  const shippingCost = isPickup ? 0 : quote?.shippingCost ?? 0;

  useEffect(() => {
    const controller = new AbortController();
    setLoadingProvincias(true);
    getProvincias(controller.signal)
      .then(setProvincias)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(`No se pudieron cargar las provincias: ${getErrorMessage(requestError)}`);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingProvincias(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!provinceId) {
      setLocalidades([]);
      setLocalityId('');
      setLoadingLocalidades(false);
      return;
    }

    const controller = new AbortController();
    setLocalidades([]);
    setLocalityId('');
    setLoadingLocalidades(true);
    getLocalidadesByProvincia(provinceId, controller.signal)
      .then(setLocalidades)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setError(`No se pudieron cargar las localidades: ${getErrorMessage(requestError)}`);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingLocalidades(false);
      });

    return () => controller.abort();
  }, [provinceId]);

  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    if (isPickup) {
      const controller = new AbortController();
      getShippingQuote({ isPickup: true }, controller.signal)
        .then(setQuote)
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) setQuoteError(getErrorMessage(requestError));
        });
      return () => controller.abort();
    }

    if (!provinceName || !localityName || !/^\d{4}$/.test(postalCode)) return;

    const controller = new AbortController();
    getShippingQuote({
      isPickup: false,
      province: provinceName,
      locality: localityName,
      postalCode,
    }, controller.signal)
      .then((shippingQuote) => {
        setQuote(shippingQuote);
        if (!shippingQuote.cashPaymentAllowed) {
          setPaymentMethod((current) => current === 'EFECTIVO' ? 'MERCADO_PAGO' : current);
        }
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) setQuoteError(getErrorMessage(requestError));
      });

    return () => controller.abort();
  }, [isPickup, provinceName, localityName, postalCode]);

  useEffect(() => {
    if (items.length === 0 && !cartLoading && !completedSale) navigate('/carrito', { replace: true });
  }, [cartLoading, completedSale, items.length, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!allItemsAvailable) {
      setError('Quitá del carrito los productos sin stock antes de confirmar la compra.');
      return;
    }
    if (!isPickup && (!provinceName || !localityName || !/^\d{4}$/.test(postalCode) || !shippingAddress.trim())) {
      setError('Completá provincia, localidad, código postal y calle y altura para el envío.');
      return;
    }
    if (!quote || (!isPickup && quoteError)) {
      setError('Esperá a que se calcule el costo de envío antes de confirmar.');
      return;
    }
    if (paymentMethod === 'EFECTIVO' && !quote.cashPaymentAllowed) {
      setError('El pago en efectivo no está disponible para esta modalidad de envío.');
      return;
    }

    try {
      setSubmitting(true);
      const checkoutItems: CheckoutItemRequest[] = items.map((item) => {
        const variantId = item.variantId;
        if (!Number.isSafeInteger(variantId) || variantId <= 0) {
          throw new Error('El carrito contiene una variante con identificador inválido.');
        }
        return { variantId, quantity: item.quantity };
      });

      const payload: CheckoutRequest = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        isPickup,
        shippingAddress: isPickup ? undefined : shippingAddress.trim(),
        shippingProvince: isPickup ? undefined : provinceName,
        shippingLocality: isPickup ? undefined : localityName,
        shippingPostalCode: isPickup ? undefined : postalCode,
        paymentMethod,
        items: checkoutItems,
      };

      const sale = await createCheckout(payload);
      if (sale.mpInitPoint) {
        window.location.href = sale.mpInitPoint;
        return;
      }
      setCompletedSale(sale);
      await clearCart();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  if (completedSale) {
    return (
      <section className="checkout-page">
        <div className="checkout-confirmation">
          <h1>¡Compra confirmada!</h1>
          <p>Guardá este código para consultar el estado de tu pedido:</p>
          <p className="checkout-confirmation__token">{completedSale.trackingToken}</p>
          {completedSale.paymentMethod === 'TRANSFERENCIA' && completedSale.paymentStatus === 'PENDIENTE' && (
            <BankTransferInstructionsCard
              saleId={completedSale.saleId}
              saleTotal={completedSale.saleTotal}
              paymentStatus={completedSale.paymentStatus}
            />
          )}
          <dl>
            <div><dt>Número de orden</dt><dd>{completedSale.saleId}</dd></div>
            <div><dt>Entrega</dt><dd>{completedSale.shippingMethod.replace(/_/g, ' ')}</dd></div>
            <div><dt>Medio de pago</dt><dd>{completedSale.paymentMethod.replace(/_/g, ' ')}</dd></div>
            <div><dt>Dirección</dt><dd>{completedSale.shippingAddress}</dd></div>
            <div><dt>Costo de envío</dt><dd>{formatCurrency(completedSale.shippingCost)}</dd></div>
            <div><dt>Total</dt><dd>{formatCurrency(completedSale.saleTotal)}</dd></div>
            <div><dt>Estado</dt><dd>{completedSale.saleStatus.replace(/_/g, ' ')}</dd></div>
          </dl>
          <div className="checkout-confirmation__items">
            <h2>Detalle de la orden</h2>
            {completedSale.items.map((item) => (
              <p key={item.saleItemId}>
                {item.productName} × {item.quantity} — {formatCurrency(item.subtotal)}
              </p>
            ))}
          </div>
          <Link className="checkout-secondary-link" to="/productos">Seguir comprando</Link>
        </div>
      </section>
    );
  }

  if (cartLoading) return <div className="checkout-page"><p role="status">Cargando carrito…</p></div>;

  return (
    <section className="checkout-page">
      <div className="checkout-heading">
        <Link to="/carrito">← Volver al carrito</Link>
        <h1>Finalizar compra</h1>
      </div>

      <form className="checkout-layout" onSubmit={handleSubmit}>
        <div className="checkout-form">
          <fieldset>
            <legend>Datos de contacto</legend>
            <label>
              Nombre y apellido
              <input required maxLength={255} value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            </label>
            <label>
              Email
              <input required type="email" maxLength={255} value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
            </label>
            <label>
              Teléfono
              <input required maxLength={50} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
            </label>
          </fieldset>

          <fieldset>
            <legend>¿Cómo querés recibir tu pedido?</legend>
            <div className="checkout-delivery-options">
              <label className={isPickup ? 'is-selected' : ''}>
                <input type="radio" name="delivery" checked={isPickup} onChange={() => setIsPickup(true)} />
                <span>Retiro en Estación Llavallol (Gratis)</span>
              </label>
              <label className={!isPickup ? 'is-selected' : ''}>
                <input type="radio" name="delivery" checked={!isPickup} onChange={() => setIsPickup(false)} />
                <span>Envío a Domicilio</span>
              </label>
            </div>

            {!isPickup && (
              <div className="checkout-address-fields">
                <label>
                  Provincia
                  <select
                    required
                    value={provinceId}
                    disabled={loadingProvincias}
                    onChange={(event) => setProvinceId(event.target.value)}
                  >
                    <option value="">{loadingProvincias ? 'Cargando provincias…' : 'Seleccioná una provincia'}</option>
                    {provincias.map((province) => <option key={province.id} value={province.id}>{province.nombre}</option>)}
                  </select>
                </label>
                <label>
                  Localidad
                  <select
                    required
                    value={localityId}
                    disabled={!provinceId || loadingLocalidades}
                    onChange={(event) => setLocalityId(event.target.value)}
                  >
                    <option value="">{loadingLocalidades ? 'Cargando localidades…' : 'Seleccioná una localidad'}</option>
                    {localidades.map((locality) => <option key={locality.id} value={locality.id}>{locality.nombre}</option>)}
                  </select>
                </label>
                <label>
                  Código Postal
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={4}
                    pattern="[0-9]{4}"
                    value={postalCode}
                    onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="Ej. 1836"
                  />
                </label>
                <label>
                  Calle y altura
                  <input required maxLength={255} autoComplete="street-address" value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} />
                </label>
              </div>
            )}

            {isPickup && <p className="checkout-info">Coordinaremos el día y horario de retiro por WhatsApp.</p>}
            {!isPickup && quote && (
              <div className="checkout-quote" role="status">
                <strong>{quote.zoneName}</strong>
                <span>Demora estimada: {quote.estimatedDays}</span>
                <span>Costo de envío: {formatCurrency(quote.shippingCost)}</span>
                {quote.description && <span>{quote.description}</span>}
              </div>
            )}
            {quoteError && <p className="checkout-error" role="alert">{quoteError}</p>}
          </fieldset>

          <fieldset>
            <legend>Medio de pago</legend>
            <div className="checkout-payment-options">
              {PAYMENT_METHODS.map((method) => {
                const cashDisabled = method.value === 'EFECTIVO' && quote?.cashPaymentAllowed === false;
                return (
                  <label key={method.value} className={cashDisabled ? 'is-disabled' : ''}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      disabled={cashDisabled}
                      onChange={() => setPaymentMethod(method.value)}
                    />
                    <span>{method.label}{cashDisabled ? ' (no disponible)' : ''}</span>
                  </label>
                );
              })}
            </div>
            {quote?.cashPaymentAllowed === false && (
              <p className="checkout-info">El efectivo no está habilitado para envíos por correo nacional.</p>
            )}
          </fieldset>

          {error && <p className="checkout-error" role="alert">{error}</p>}
          <button className="checkout-button" type="submit" disabled={submitting || !allItemsAvailable || !quote}>
            {submitting ? 'Procesando compra…' : 'Confirmar compra'}
          </button>
        </div>

        <aside className="checkout-summary">
          <h2>Resumen del pedido</h2>
          {items.map((item) => (
            <div className="checkout-summary__item" key={item.variantId}>
              <span>{item.productTitle} {item.attributesDescription ? `· ${item.attributesDescription}` : ''} × {item.quantity}</span>
              <strong>{formatCurrency(item.subtotal)}</strong>
            </div>
          ))}
          <div className="checkout-summary__line">
            <span>Productos</span><span>{formatCurrency(productsSubtotal)}</span>
          </div>
          <div className="checkout-summary__line">
            <span>Envío</span><span>{isPickup ? 'Gratis' : quote ? formatCurrency(quote.shippingCost) : 'A cotizar'}</span>
          </div>
          <div className="checkout-summary__total">
            <span>Total estimado</span><strong>{formatCurrency(productsSubtotal + shippingCost)}</strong>
          </div>
        </aside>
      </form>
    </section>
  );
};

export default CheckoutForm;
