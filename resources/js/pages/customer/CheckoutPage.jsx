import { useEffect, useMemo, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import TextArea from '../../components/common/TextArea.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, formatWeight } from '../../utils/format.js';

export default function CheckoutPage({ token, user, navigate, setNotice, refreshCartCount }) {
    const [form, setForm] = useState({ customer_name: user?.name || '', customer_phone: '', shipping_address: '', destination_city: '', notes: '' });
    const [loading, setLoading] = useState(false);
    const [shippingLoading, setShippingLoading] = useState(false);
    const [shippingOptions, setShippingOptions] = useState([]);
    const [shippingMessage, setShippingMessage] = useState('');
    const [shippingMeta, setShippingMeta] = useState(null);
    const [selectedShippingRateId, setSelectedShippingRateId] = useState('');
    const [cart, setCart] = useState(null);
    const [touched, setTouched] = useState({});
    const errors = checkoutErrors(form, selectedShippingRateId);
    const items = cart?.items || [];
    const affiliateCode = typeof window !== 'undefined' ? localStorage.getItem('affiliate_ref') : '';
    const totalItems = useMemo(() => items.reduce((total, item) => total + Number(item.quantity || 0), 0), [items]);
    const selectedShipping = shippingOptions.find((rate) => String(rate.id) === String(selectedShippingRateId));
    const totalPayment = Number(cart?.total_amount || 0) + Number(selectedShipping?.cost || 0);

    useEffect(() => {
        if (!token) return;

        apiRequest('/cart', { token })
            .then((response) => setCart(response.data))
            .catch((error) => setNotice(error.message));
    }, [token, setNotice]);

    useEffect(() => {
        if (!user?.name || form.customer_name) return;

        setForm((current) => ({ ...current, customer_name: user.name }));
    }, [user?.name]);

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));

        if (field === 'destination_city') {
            setSelectedShippingRateId('');
            setShippingOptions([]);
            setShippingMessage('');
            setShippingMeta(null);
        }
    }

    function markTouched(field) {
        setTouched((current) => ({ ...current, [field]: true }));
    }

    async function loadShippingRates() {
        const destinationCity = form.destination_city.trim();
        setTouched((current) => ({ ...current, destination_city: true, shipping_rate_id: true }));

        if (!destinationCity) {
            setShippingOptions([]);
            setShippingMessage('Please enter a destination city first.');
            return;
        }

        setShippingLoading(true);
        setSelectedShippingRateId('');

        try {
            const response = await apiRequest(`/shipping-rates?destination_city=${encodeURIComponent(destinationCity)}`, { token });
            setShippingOptions(response.data?.rates || []);
            setShippingMeta(response.data || null);
            setShippingMessage(response.message || '');
        } catch (error) {
            setShippingOptions([]);
            setShippingMeta(null);
            setShippingMessage(error.message);
        } finally {
            setShippingLoading(false);
        }
    }

    async function submit(event) {
        event.preventDefault();
        const invalidFields = Object.keys(errors);

        if (invalidFields.length > 0) {
            setTouched({ customer_name: true, customer_phone: true, shipping_address: true, destination_city: true, shipping_rate_id: true });
            setNotice('Please complete shipping details and select a shipping method.');
            return;
        }

        setLoading(true);
        setNotice('');

        try {
            const affiliateCode = localStorage.getItem('affiliate_ref');
            const affiliateClickId = localStorage.getItem('affiliate_click_id');
            const data = await apiRequest('/checkout', {
                method: 'POST',
                token,
                body: {
                    ...form,
                    shipping_rate_id: Number(selectedShippingRateId),
                    affiliate_code: affiliateCode || undefined,
                    affiliate_click_id: affiliateClickId || undefined,
                },
            });
            setNotice('Order created. Opening payment popup...');
            await refreshCartCount?.();
            await openSnap(data, token, setNotice, () => navigate('orders'));
        } catch (error) {
            setNotice(error.message);
        } finally {
            setLoading(false);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section className="checkout-page">
            <header className="checkout-heading">
                <p className="eyebrow">Checkout</p>
                <h1>Complete your order</h1>
                
            </header>

            <div className="checkout-layout">
                <form id="checkout-order-form" className="checkout-form" noValidate onSubmit={submit}>
                    <section className="checkout-form-card">
                        <CheckoutCardHeading step="01" title="Shipping Details" />
                        <div className="checkout-field-grid">
                            <TextInput
                                label="Recipient Name"
                                value={form.customer_name}
                                placeholder="Full Name"
                                autoComplete="name"
                                
                                error={touched.customer_name ? errors.customer_name : ''}
                                onBlur={() => markTouched('customer_name')}
                                onChange={(value) => update('customer_name', value)}
                            />
                            <TextInput
                                label="Phone Number"
                                value={form.customer_phone}
                                placeholder="e.g. +6281234567890"
                                autoComplete="tel"
                                inputMode="tel"
                                
                                error={touched.customer_phone ? errors.customer_phone : ''}
                                onBlur={() => markTouched('customer_phone')}
                                onChange={(value) => update('customer_phone', value)}
                            />
                        </div>

                        <TextArea
                            label="Street Address"
                            value={form.shipping_address}
                            required
                            rows={5}
                            placeholder="Street name, building/house number, district, postal code"
                            
                            error={touched.shipping_address ? errors.shipping_address : ''}
                            onBlur={() => markTouched('shipping_address')}
                            onChange={(value) => update('shipping_address', value)}
                        />
                        <div className="checkout-destination-row">
                            <TextInput
                                label="City"
                                value={form.destination_city}
                                placeholder="e.g. Jakarta"
                                
                                error={touched.destination_city ? errors.destination_city : ''}
                                onBlur={() => markTouched('destination_city')}
                                onChange={(value) => update('destination_city', value)}
                            />
                            <button className="btn ghost checkout-rate-button" type="button" disabled={shippingLoading || items.length === 0} onClick={loadShippingRates}>
                                {shippingLoading ? 'Loading...' : 'Check rates'}
                            </button>
                        </div>
                    </section>

                    <section className="checkout-form-card">
                        <CheckoutCardHeading step="02" title="Shipping Service" />
                        {shippingMeta?.origin_city && (
                            <p className="checkout-origin-note">Shipped from <strong>{shippingMeta.origin_city}</strong> ke <strong>{shippingMeta.destination_city}</strong>.</p>
                        )}
                        <div className="checkout-shipping-options">
                            {shippingOptions.map((rate) => (
                                <label className={`checkout-shipping-option ${String(rate.id) === String(selectedShippingRateId) ? 'selected' : ''}`} key={rate.id}>
                                    <input
                                        checked={String(rate.id) === String(selectedShippingRateId)}
                                        name="shipping_rate_id"
                                        type="radio"
                                        value={rate.id}
                                        onChange={() => {
                                            setSelectedShippingRateId(String(rate.id));
                                            setTouched((current) => ({ ...current, shipping_rate_id: true }));
                                        }}
                                    />
                                    <span>
                                        <strong>{rate.courier} <small>{rate.service}</small></strong>
                                        <small>Est. delivery {rate.estimated_days}</small>
                                    </span>
                                    <strong>{formatPrice(rate.cost)}</strong>
                                </label>
                            ))}
                            {shippingMessage && <p className={`checkout-shipping-message ${shippingOptions.length ? '' : 'unavailable'}`}>{shippingMessage}</p>}
                            {!shippingMessage && shippingOptions.length === 0 && <p className="checkout-shipping-message">Please enter city and click check rates to view available services.</p>}
                            {touched.shipping_rate_id && errors.shipping_rate_id && <small className="field-error">{errors.shipping_rate_id}</small>}
                        </div>
                    </section>

                    <section className="checkout-form-card">
                        <CheckoutCardHeading step="03" title="Payment & Notes" />
                        <div className="checkout-payment-method">
                            <span>Payment Method</span>
                            <strong>Midtrans Snap (Cards, bank transfer, e-wallet)</strong>
                        </div>
 ``
                        <TextArea
                            label="Order Notes"
                            value={form.notes}
                            required={false}
                            rows={4}
                            placeholder="e.g. Leave package at security office"
                            
                            onChange={(value) => update('notes', value)}
                        />
                    </section>
                </form>

                <aside className="checkout-summary-card">
                    <div>
                        <p className="eyebrow">Order Summary</p>
                        <h2>{totalItems} {totalItems === 1 ? 'item' : 'items'}</h2>
                    </div>

                    <div className="checkout-product-list">
                        {cart === null ? (
                            <CheckoutSummaryLoading />
                        ) : items.length === 0 ? (
                            <p className="muted">Your cart is empty.</p>
                        ) : (
                            items.map((item) => <CheckoutLineItem item={item} key={item.id} />)
                        )}
                    </div>

                    <div className="checkout-total-list">
                        <div>
                            <span>Subtotal</span>
                            <strong>{formatPrice(cart?.total_amount)}</strong>
                        </div>
                        <div>
                            <span>Shipping{selectedShipping ? ` (${selectedShipping.courier} ${selectedShipping.service})` : ''}</span>
                            <strong>{selectedShipping ? formatPrice(selectedShipping.cost) : '-'}</strong>
                        </div>
                        <div>
                            <span>Total</span>
                            <strong>{formatPrice(totalPayment)}</strong>
                        </div>
                    </div>

                    <div className="checkout-affiliate-note">
                        <span>Voucher / Affiliate</span>
                        <strong>{affiliateCode || 'Not applied'}</strong>
                    </div>

                    <button className="btn primary checkout-pay-button" type="submit" form="checkout-order-form" disabled={loading || items.length === 0 || !selectedShippingRateId}>
                        {loading ? 'Processing...' : 'Pay Now'}
                    </button>
                    
                </aside>
            </div>
        </section>
    );
}

function CheckoutCardHeading({ step, title }) {
    return (
        <header className="checkout-card-heading">
            <span>{step}</span>
            <div>
                <h2>{title}</h2>
                
            </div>
        </header>
    );
}

function CheckoutLineItem({ item }) {
    return (
        <article className="checkout-line-item">
            <ProductImage product={item.product} small />
            <div>
                <strong>{item.product?.name}</strong>
                <span>{formatWeight(item.variant?.weight_grams)} / {item.variant?.grind_size}</span>
                <small>{item.quantity} x {formatPrice(item.variant?.price)}</small>
            </div>
            <strong>{formatPrice(item.subtotal)}</strong>
        </article>
    );
}

function CheckoutSummaryLoading() {
    return (
        <div className="checkout-summary-loading">
            <span />
            <span />
        </div>
    );
}

function checkoutErrors(form, shippingRateId) {
    const errors = {};

    if (!form.customer_name.trim()) errors.customer_name = 'Recipient name is required.';
    if (!form.customer_phone.trim()) errors.customer_phone = 'Phone number is required.';
    if (!form.shipping_address.trim()) errors.shipping_address = 'Shipping address is required.';
    if (!form.destination_city.trim()) errors.destination_city = 'City is required.';
    if (!shippingRateId) errors.shipping_rate_id = 'Please select a shipping method.';

    return errors;
}

async function openSnap(data, token, setNotice, onDone) {
    const scriptUrl = data.snap_script_url;
    const clientKey = data.midtrans_client_key;

    if (!window.snap) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.dataset.clientKey = clientKey || '';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    if (!window.snap) {
        setNotice('Failed to load Snap payment script.');
        return;
    }

    window.snap.pay(data.snap_token, {
        onSuccess: async (result) => {
            const synced = await syncPaymentAfterSnap(data, token, setNotice, result);
            if (synced) setNotice('Payment successful. Order status synchronized.');
            onDone();
        },
        onPending: () => {
            setNotice('Payment pending. Please complete your payment.');
            onDone();
        },
        onError: () => setNotice('Payment failed.'),
        onClose: () => setNotice('Payment popup closed.'),
    });
}

async function syncPaymentAfterSnap(data, token, setNotice, snapResult = null) {
    const orderId = data?.data?.id;

    if (!orderId || !token) return false;

    for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
            const response = await apiRequest(`/orders/${orderId}/sync-payment`, {
                method: 'POST',
                token,
                body: snapResult ? { snap_result: snapResult } : undefined,
            });
            const order = response.data;
            const paidStatuses = ['paid', 'processing', 'shipped', 'completed'];

            if (paidStatuses.includes(order?.status) || order?.payment?.status === 'paid') {
                return true;
            }
        } catch (error) {
            setNotice(error.message);
            return false;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1200 * (attempt + 1)));
    }

    setNotice('Payment received, waiting for synchronization.');
    return false;
}
