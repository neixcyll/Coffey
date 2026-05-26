import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import Stat from '../../components/common/Stat.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import OrderCard from '../../components/order/OrderCard.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';

export default function UserDashboardPage({ token, user, navigate, setNotice, saveSession }) {
    const [orders, setOrders] = useState([]);
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        password_confirmation: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setForm((current) => ({
                ...current,
                name: user.name || '',
                email: user.email || '',
            }));
        }
    }, [user?.id, user?.name, user?.email]);

    useEffect(() => {
        if (!token) return;
        apiRequest('/orders', { token })
            .then((data) => setOrders(data.data || []))
            .catch((error) => setNotice(error.message));
    }, [token, setNotice]);

    async function saveProfile(event) {
        event.preventDefault();
        setSaving(true);
        setNotice('');

        try {
            const payload = {
                name: form.name,
                email: form.email,
            };

            if (form.password) {
                payload.password = form.password;
                payload.password_confirmation = form.password_confirmation;
            }

            const response = await apiRequest('/user', { method: 'PATCH', token, body: payload });
            saveSession(token, response.user);
            setForm((current) => ({ ...current, password: '', password_confirmation: '' }));
            setNotice(response.message);
        } catch (error) {
            setNotice(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    const paidOrders = orders.filter((order) => ['paid', 'processing', 'shipped', 'completed'].includes(order.status));
    const totalSpent = paidOrders.reduce((total, order) => total + Number(order.total_amount || 0), 0);

    return (
        <section className="customer-dashboard">
            <PageTitle eyebrow="Customer" title="Dashboard akun" />
            <div className="stats">
                <Stat label="Total order" value={orders.length} />
                <Stat label="Order aktif" value={orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length} />
                <Stat label="Total belanja" value={formatPrice(totalSpent)} />
            </div>
            <div className="dashboard-grid">
                <div className="panel form-grid">
                    <h2>Pengaturan akun</h2>
                    <form className="form-grid" onSubmit={saveProfile}>
                        <TextInput label="Nama" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                        <TextInput label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
                        <div className="grid-2">
                            <TextInput label="Password baru" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} required={false} />
                            <TextInput label="Konfirmasi password" type="password" value={form.password_confirmation} onChange={(value) => setForm({ ...form, password_confirmation: value })} required={false} />
                        </div>
                        <button className="btn primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan akun'}</button>
                    </form>
                </div>
                <div className="stack">
                    <div className="section-head">
                        <div>
                            <p className="eyebrow">Riwayat</p>
                            <h2>Order terbaru</h2>
                        </div>
                        <button className="btn ghost" onClick={() => navigate('orders')}>Lihat semua</button>
                    </div>
                    {orders.slice(0, 5).map((order) => <OrderCard key={order.id} order={order} />)}
                    {orders.length === 0 && <p className="muted">Belum ada order.</p>}
                </div>
            </div>
        </section>
    );
}
