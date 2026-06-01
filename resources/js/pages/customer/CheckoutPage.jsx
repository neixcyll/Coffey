import { useEffect, useMemo, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import TextArea from '../../components/common/TextArea.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, formatWeight } from '../../utils/format.js';

export default function CheckoutPage({ token, user, navigate, setNotice, refreshCartCount }) {
    const [form, setForm] = useState({ customer_name: user?.name || '', customer_phone: '', shipping_address: '', notes: '' });
    const [loading, setLoading] = useState(false);
    const [cart, setCart] = useState(null);
    const [touched, setTouched] = useState({});
    const errors = checkoutErrors(form);
    const items = cart?.items || [];
    const totalItems = useMemo(() => items.reduce((total, item) => total + Number(item.quantity || 0), 0), [items]);

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
    }

    function markTouched(field) {
        setTouched((current) => ({ ...current, [field]: true }));
    }

    async function submit(event) {
        event.preventDefault();
        const invalidFields = Object.keys(errors);

        if (invalidFields.length > 0) {
            setTouched({ customer_name: true, customer_phone: true, shipping_address: true });
            setNotice('Lengkapi data penerima dan alamat pengiriman sebelum melanjutkan pembayaran.');
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
                    affiliate_code: affiliateCode || undefined,
                    affiliate_click_id: affiliateClickId || undefined,
                },
            });
            setNotice('Order dibuat. Membuka Midtrans Snap.');
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
                <h1>Selesaikan pesanan kopimu</h1>
                <p>Isi detail pengiriman, periksa kembali produk, lalu lanjutkan pembayaran melalui Midtrans Snap.</p>
            </header>

            <div className="checkout-layout">
                <form id="checkout-order-form" className="checkout-form" noValidate onSubmit={submit}>
                    <section className="checkout-form-card">
                        <CheckoutCardHeading step="01" title="Data penerima" description="Pastikan kurir dapat menghubungi penerima pesanan." />
                        <div className="checkout-field-grid">
                            <TextInput
                                label="Nama penerima"
                                value={form.customer_name}
                                placeholder="Nama lengkap penerima"
                                autoComplete="name"
                                helper="Gunakan nama yang mudah dikenali saat paket diterima."
                                error={touched.customer_name ? errors.customer_name : ''}
                                onBlur={() => markTouched('customer_name')}
                                onChange={(value) => update('customer_name', value)}
                            />
                            <TextInput
                                label="Nomor telepon"
                                value={form.customer_phone}
                                placeholder="Contoh: 081234567890"
                                autoComplete="tel"
                                inputMode="tel"
                                helper="Nomor aktif untuk konfirmasi pengiriman."
                                error={touched.customer_phone ? errors.customer_phone : ''}
                                onBlur={() => markTouched('customer_phone')}
                                onChange={(value) => update('customer_phone', value)}
                            />
                        </div>
                    </section>

                    <section className="checkout-form-card">
                        <CheckoutCardHeading step="02" title="Alamat pengiriman" description="Tulis alamat selengkap mungkin agar paket tiba tanpa kendala." />
                        <TextArea
                            label="Alamat lengkap"
                            value={form.shipping_address}
                            required
                            rows={5}
                            placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota, dan kode pos"
                            helper="Sertakan patokan lokasi bila alamat sulit ditemukan."
                            error={touched.shipping_address ? errors.shipping_address : ''}
                            onBlur={() => markTouched('shipping_address')}
                            onChange={(value) => update('shipping_address', value)}
                        />
                    </section>

                    <section className="checkout-form-card">
                        <CheckoutCardHeading step="03" title="Catatan pesanan" description="Opsional. Tambahkan instruksi khusus untuk seller atau kurir." />
                        <TextArea
                            label="Catatan"
                            value={form.notes}
                            required={false}
                            rows={4}
                            placeholder="Contoh: titip ke security jika tidak ada orang di rumah"
                            helper="Kosongkan bila tidak ada catatan tambahan."
                            onChange={(value) => update('notes', value)}
                        />
                    </section>
                </form>

                <aside className="checkout-summary-card">
                    <div>
                        <p className="eyebrow">Ringkasan pesanan</p>
                        <h2>{totalItems} item di checkout</h2>
                    </div>

                    <div className="checkout-product-list">
                        {cart === null ? (
                            <CheckoutSummaryLoading />
                        ) : items.length === 0 ? (
                            <p className="muted">Cart masih kosong. Tambahkan produk sebelum checkout.</p>
                        ) : (
                            items.map((item) => <CheckoutLineItem item={item} key={item.id} />)
                        )}
                    </div>

                    <div className="checkout-total-list">
                        <div>
                            <span>Subtotal produk</span>
                            <strong>{formatPrice(cart?.total_amount)}</strong>
                        </div>
                        <div>
                            <span>Total pembayaran</span>
                            <strong>{formatPrice(cart?.total_amount)}</strong>
                        </div>
                    </div>

                    <button className="btn primary checkout-pay-button" type="submit" form="checkout-order-form" disabled={loading || items.length === 0}>
                        {loading ? 'Membuat order...' : 'Bayar dengan Snap'}
                    </button>
                    <p className="checkout-payment-note">Pembayaran diproses aman melalui Midtrans. Stock dikurangi setelah status pembayaran berhasil dikonfirmasi.</p>
                </aside>
            </div>
        </section>
    );
}

function CheckoutCardHeading({ step, title, description }) {
    return (
        <header className="checkout-card-heading">
            <span>{step}</span>
            <div>
                <h2>{title}</h2>
                <p>{description}</p>
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

function checkoutErrors(form) {
    const errors = {};

    if (!form.customer_name.trim()) errors.customer_name = 'Nama penerima wajib diisi.';
    if (!form.customer_phone.trim()) errors.customer_phone = 'Nomor telepon wajib diisi.';
    if (!form.shipping_address.trim()) errors.shipping_address = 'Alamat pengiriman wajib diisi.';

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
        setNotice('snap.js gagal dimuat.');
        return;
    }

    window.snap.pay(data.snap_token, {
        onSuccess: async (result) => {
            const synced = await syncPaymentAfterSnap(data, token, setNotice, result);
            if (synced) setNotice('Pembayaran sukses. Status order sudah disinkronkan.');
            onDone();
        },
        onPending: () => {
            setNotice('Pembayaran pending. Selesaikan pembayaran sesuai instruksi Midtrans.');
            onDone();
        },
        onError: () => setNotice('Pembayaran gagal.'),
        onClose: () => setNotice('Popup Snap ditutup sebelum pembayaran selesai.'),
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

    setNotice('Pembayaran diterima Snap, tetapi status order masih menunggu sinkronisasi Midtrans.');
    return false;
}
