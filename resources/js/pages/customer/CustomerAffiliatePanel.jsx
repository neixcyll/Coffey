import { useEffect, useMemo, useState } from 'react';
import NeedCustomerAccount from '../../components/common/NeedCustomerAccount.jsx';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import Stat from '../../components/common/Stat.jsx';
import TextArea from '../../components/common/TextArea.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import { roleName } from '../../utils/route.js';
import AffiliateContentPage from '../affiliate/AffiliateContentPage.jsx';

export default function CustomerAffiliatePanel({ section = 'overview', token, user, navigate, setNotice, logout }) {
    const [data, setData] = useState(null);
    const [commissions, setCommissions] = useState([]);
    const [showRegistration, setShowRegistration] = useState(false);
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
                const commissionResponse = await apiRequest('/affiliate/commissions?per_page=30', { token });
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

    async function copyLink() {
        const code = data?.profile?.code;
        if (!code) return;

        await navigator.clipboard?.writeText(catalogAffiliateLink(code));
        setNotice('Link affiliate disalin.');
    }

    const promotedProducts = useMemo(() => productsFromTracking(data, commissions), [data, commissions]);

    if (!token) return <NeedLogin navigate={navigate} />;
    if (!user) return <p className="muted">Memuat akun...</p>;
    if (roleName(user) !== 'customer') return <NeedCustomerAccount logout={logout} />;
    if (data === false) return <NeedCustomerAccount logout={logout} />;
    if (!data) return <p className="muted">Memuat affiliate...</p>;

    if (section === 'upload' || section === 'content') {
        return (
            <section className="customer-affiliate-page">
                <div className="customer-section-head">
                    <div>
                        <p className="eyebrow">Affiliate Panel</p>
                        <h2>{section === 'upload' ? 'Upload konten affiliate' : 'Konten affiliate saya'}</h2>
                    </div>
                    <button className="btn ghost" type="button" onClick={() => navigate('affiliate-dashboard')}>Kembali ke ringkasan</button>
                </div>
                <AffiliateContentPage embedded mode={section === 'upload' ? 'upload' : 'library'} token={token} user={user} navigate={navigate} setNotice={setNotice} logout={logout} />
            </section>
        );
    }

    if (data.requires_registration) {
        return (
            <section className="customer-affiliate-page">
                <div className="panel customer-affiliate-cta">
                    <span className="customer-affiliate-mark">%</span>
                    <div>
                        <p className="eyebrow">Affiliate Panel</p>
                        <h2>Mulai affiliate kopi kamu</h2>
                        <p className="muted">Daftar dengan akun customer ini untuk mendapat kode affiliate, membagikan link produk, dan memantau komisi.</p>
                    </div>
                    {!showRegistration && <button className="btn primary" type="button" onClick={() => setShowRegistration(true)}>Mulai affiliate</button>}
                </div>

                {showRegistration && (
                    <form className="panel form-grid customer-affiliate-register" onSubmit={registerAffiliate}>
                        <div>
                            <p className="eyebrow">Pendaftaran affiliate</p>
                            <h3>Lengkapi informasi payout</h3>
                        </div>
                        <TextInput label="Nama affiliate" value={form.affiliate_name} onChange={(value) => setForm({ ...form, affiliate_name: value })} />
                        <TextInput label="Telepon" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} required={false} />
                        <div className="grid-2">
                            <TextInput label="Bank payout" value={form.payout_bank} onChange={(value) => setForm({ ...form, payout_bank: value })} required={false} />
                            <TextInput label="Nomor rekening" value={form.payout_account_number} onChange={(value) => setForm({ ...form, payout_account_number: value })} required={false} />
                        </div>
                        <TextInput label="Nama pemilik rekening" value={form.payout_account_name} onChange={(value) => setForm({ ...form, payout_account_name: value })} required={false} />
                        <TextArea label="Catatan" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
                        <div className="row">
                            <button className="btn primary" disabled={registering}>{registering ? 'Mendaftarkan...' : 'Daftar menjadi affiliate'}</button>
                            <button className="btn ghost" type="button" onClick={() => setShowRegistration(false)}>Batal</button>
                        </div>
                    </form>
                )}
            </section>
        );
    }

    const summary = data.summary;

    return (
        <section className="customer-affiliate-page">
            <div className="customer-section-head">
                <div>
                    <p className="eyebrow">Affiliate Panel</p>
                    <h2>Ringkasan affiliate kamu</h2>
                    <p className="muted">Pantau komisi, produk terhubung, dan order referral dari link kamu.</p>
                </div>
                <button className="btn primary" type="button" onClick={() => navigate('blog')}>Cari produk</button>
            </div>

            <div className="customer-affiliate-summary">
                <Stat label="Total komisi" value={formatPrice(summary.total_commission)} />
                <Stat label="Komisi pending" value={formatPrice(summary.pending_commission)} />
                <Stat label="Komisi paid" value={formatPrice(summary.paid_commission)} />
            </div>

            <section className="panel customer-affiliate-link-card">
                <div>
                    <p className="eyebrow">Link affiliate</p>
                    <h3>Kode: {data.profile.code}</h3>
                    <code>{catalogAffiliateLink(data.profile.code)}</code>
                </div>
                <button className="btn ghost" type="button" onClick={copyLink}>Copy link</button>
            </section>

            <div className="customer-affiliate-grid">
                <section className="panel customer-affiliate-products">
                    <div>
                        <p className="eyebrow">Produk yang dipromosikan</p>
                        <h3>Produk terpantau dari link kamu</h3>
                    </div>
                    <div className="customer-affiliate-product-list">
                        {promotedProducts.map((product) => (
                            <div key={product.id}>
                                <span>{product.name?.slice(0, 1) || 'K'}</span>
                                <div>
                                    <strong>{product.name}</strong>
                                    <small>{product.trackingCount} aktivitas affiliate</small>
                                </div>
                            </div>
                        ))}
                        {promotedProducts.length === 0 && <p className="muted">Belum ada produk yang terpantau dari link affiliate.</p>}
                    </div>
                </section>

                <section className="panel customer-affiliate-tools">
                    <div>
                        <p className="eyebrow">Tools affiliate</p>
                        <h3>Promosi melalui konten</h3>
                        <p className="muted">Upload artikel rekomendasi atau kelola konten affiliate yang sudah kamu buat.</p>
                    </div>
                    <div className="customer-affiliate-tool-actions">
                        <button className="btn primary" type="button" onClick={() => navigate('affiliate-dashboard', 'upload')}>Upload content</button>
                        <button className="btn ghost" type="button" onClick={() => navigate('affiliate-dashboard', 'content')}>My content</button>
                    </div>
                </section>
            </div>

            <section className="panel customer-referral-history">
                <div className="customer-section-head compact">
                    <div>
                        <p className="eyebrow">Riwayat referral</p>
                        <h3>Order dari affiliate</h3>
                    </div>
                    <span className="customer-referral-count">{summary.total_conversions} konversi</span>
                </div>
                <div className="table-wrap">
                    <table>
                        <thead><tr><th>Order</th><th>Produk</th><th>Subtotal</th><th>Komisi</th><th>Status</th></tr></thead>
                        <tbody>
                            {commissions.map((commission) => (
                                <tr key={commission.id}>
                                    <td>{commission.order?.order_number || '-'}</td>
                                    <td>{commission.product?.name || '-'}</td>
                                    <td>{formatPrice(commission.amount)}</td>
                                    <td>{formatPrice(commission.commission_amount)}</td>
                                    <td><span className={`content-status ${statusClass(commission.status)}`}>{commission.status}</span></td>
                                </tr>
                            ))}
                            {commissions.length === 0 && <tr><td colSpan="5">Belum ada order referral.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </section>
        </section>
    );
}

function productsFromTracking(data, commissions) {
    const products = new Map();
    const rows = [
        ...(data?.recent_clicks || []),
        ...commissions,
    ];

    rows.forEach((row) => {
        if (!row.product?.id) return;

        const current = products.get(row.product.id) || { ...row.product, trackingCount: 0 };
        current.trackingCount += 1;
        products.set(row.product.id, current);
    });

    return [...products.values()].sort((left, right) => right.trackingCount - left.trackingCount);
}

function catalogAffiliateLink(code) {
    return `${window.location.origin}/explore?ref=${code}`;
}

function statusClass(status) {
    if (['approved', 'paid'].includes(status)) return 'published';
    if (status === 'pending') return 'pending';
    if (status === 'cancelled') return 'rejected';

    return 'draft';
}
