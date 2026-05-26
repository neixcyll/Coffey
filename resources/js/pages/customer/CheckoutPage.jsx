import { useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import TextArea from '../../components/common/TextArea.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { apiRequest } from '../../services/api.js';

export default function CheckoutPage({ token, user, navigate, setNotice, refreshCartCount }) {
    const [form, setForm] = useState({ customer_name: user?.name || '', customer_phone: '', shipping_address: '', notes: '' });
    const [loading, setLoading] = useState(false);

    async function submit(event) {
        event.preventDefault();
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
        <section className="auth-layout">
            <div>
                <p className="eyebrow">Checkout</p>
                <h1>Alamat pengiriman</h1>
                <p className="muted">Stock baru dikurangi setelah Midtrans mengirim status sukses ke webhook backend.</p>
            </div>
            <form className="panel form-grid" onSubmit={submit}>
                <TextInput label="Nama penerima" value={form.customer_name} onChange={(value) => setForm({ ...form, customer_name: value })} />
                <TextInput label="Telepon" value={form.customer_phone} onChange={(value) => setForm({ ...form, customer_phone: value })} />
                <TextArea label="Alamat" value={form.shipping_address} onChange={(value) => setForm({ ...form, shipping_address: value })} />
                <TextArea label="Catatan" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
                <button className="btn primary wide" disabled={loading}>{loading ? 'Membuat order...' : 'Bayar dengan Snap'}</button>
            </form>
        </section>
    );
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
