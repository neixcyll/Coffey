import { useEffect, useState } from 'react';
import NeedCustomerAccount from '../../components/common/NeedCustomerAccount.jsx';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import Stat from '../../components/common/Stat.jsx';
import TextArea from '../../components/common/TextArea.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import { roleName } from '../../utils/route.js';

export default function AffiliateDashboardPage({ token, user, navigate, setNotice, logout }) {
    const [data, setData] = useState(null);
    const [commissions, setCommissions] = useState([]);
    const [registering, setRegistering] = useState(false);
    const [form, setForm] = useState({
        affiliate_name: user?.name || '',
        phone: '',
        payout_bank: '',
        payout_account_name: user?.name || '',
        payout_account_number: '',
        notes: '',
    });

    useEffect(() => {
        if (!token) return;
        loadAffiliate();
    }, [token]);

    async function loadAffiliate() {
        try {
            const dashboard = await apiRequest('/affiliate/dashboard', { token });
            setData(dashboard.data);

            if (!dashboard.data.requires_registration) {
                const commissionResponse = await apiRequest('/affiliate/commissions', { token });
                setCommissions(rowsFrom(commissionResponse));
            } else {
                setCommissions([]);
            }
        } catch (error) {
            setNotice(error.message);
            setData(false);
        }
    }

    async function registerAffiliate(event) {
        event.preventDefault();
        setRegistering(true);
        setNotice('');

        try {
            await apiRequest('/affiliate/register', { method: 'POST', token, body: form });
            setNotice('Pendaftaran affiliate berhasil.');
            await loadAffiliate();
        } catch (error) {
            setNotice(error.message);
        } finally {
            setRegistering(false);
        }
    }

    async function copyLink(path = '#products') {
        const code = data?.profile?.code;
        if (!code) return;

        const link = `${window.location.origin}${window.location.pathname}?ref=${code}${path}`;
        await navigator.clipboard?.writeText(link);
        setNotice('Link affiliate disalin.');
    }

    if (!token) return <NeedLogin navigate={navigate} />;
    if (!user) return <p className="muted">Memuat akun...</p>;
    if (roleName(user) !== 'customer') return <NeedCustomerAccount logout={logout} />;
    if (data === false) return <NeedCustomerAccount logout={logout} />;
    if (!data) return <p className="muted">Memuat affiliate...</p>;

    if (data.requires_registration) {
        return (
            <section className="auth-layout">
                <div>
                    <p className="eyebrow">Affiliate</p>
                    <h1>Daftar akun affiliate</h1>
                    <p className="muted">Akun customer kamu tetap dipakai untuk login. Form ini membuat akun affiliate yang terhubung ke user tersebut.</p>
                </div>
                <form className="panel form-grid" onSubmit={registerAffiliate}>
                    <TextInput label="Nama affiliate" value={form.affiliate_name} onChange={(value) => setForm({ ...form, affiliate_name: value })} />
                    <TextInput label="Telepon" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} required={false} />
                    <div className="grid-2">
                        <TextInput label="Bank payout" value={form.payout_bank} onChange={(value) => setForm({ ...form, payout_bank: value })} required={false} />
                        <TextInput label="Nomor rekening" value={form.payout_account_number} onChange={(value) => setForm({ ...form, payout_account_number: value })} required={false} />
                    </div>
                    <TextInput label="Nama pemilik rekening" value={form.payout_account_name} onChange={(value) => setForm({ ...form, payout_account_name: value })} required={false} />
                    <TextArea label="Catatan" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
                    <button className="btn primary wide" disabled={registering}>{registering ? 'Mendaftarkan...' : 'Daftar menjadi affiliate'}</button>
                </form>
            </section>
        );
    }

    const summary = data.summary;

    return (
        <section>
            <PageTitle eyebrow="Affiliate" title="Dashboard affiliate" />
            <div className="panel affiliate-card">
                <div>
                    <span className="muted">Kode affiliate</span>
                    <strong>{data.profile.code}</strong>
                </div>
                <div className="row">
                    <button className="btn primary" onClick={() => copyLink('#products')}>Copy katalog link</button>
                    <button className="btn ghost" onClick={() => navigate('affiliate-content')}>Content</button>
                </div>
            </div>
            <div className="stats">
                <Stat label="Klik" value={summary.total_clicks} />
                <Stat label="Konversi" value={summary.total_conversions} />
                <Stat label="Pending" value={formatPrice(summary.pending_commission)} />
                <Stat label="Approved" value={formatPrice(summary.approved_commission)} />
                <Stat label="Paid" value={formatPrice(summary.paid_commission)} />
                <Stat label="Total" value={formatPrice(summary.total_commission)} />
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Order</th><th>Produk</th><th>Subtotal</th><th>Komisi</th><th>Status</th></tr></thead>
                    <tbody>
                        {commissions.map((commission) => (
                            <tr key={commission.id}>
                                <td>{commission.order?.order_number}</td>
                                <td>{commission.product?.name || '-'}</td>
                                <td>{formatPrice(commission.amount)}</td>
                                <td>{formatPrice(commission.commission_amount)}</td>
                                <td>{commission.status}</td>
                            </tr>
                        ))}
                        {commissions.length === 0 && <tr><td colSpan="5">Belum ada komisi.</td></tr>}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
