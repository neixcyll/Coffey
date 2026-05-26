import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import { AFFILIATE_PROFILE_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminAffiliatesPage({ token, navigate, setNotice }) {
    const [affiliates, setAffiliates] = useState([]);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (!token) return;
        loadAffiliates();
    }, [token, status]);

    async function loadAffiliates() {
        const query = status ? `?status=${status}` : '';
        const response = await apiRequest(`/admin/affiliates${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setAffiliates(rowsFrom(response));
    }

    async function updateAffiliate(affiliate, patch) {
        try {
            await apiRequest(`/admin/affiliates/${affiliate.id}`, { method: 'PATCH', token, body: patch });
            setNotice('Affiliate diperbarui.');
            loadAffiliates();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-affiliates" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Affiliate monitoring" />
            <div className="filters compact">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">Semua status</option>
                    {AFFILIATE_PROFILE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>User</th><th>Kode</th><th>Rate</th><th>Klik</th><th>Konversi</th><th>Total komisi</th><th>Status</th></tr></thead>
                    <tbody>
                        {affiliates.map((affiliate) => (
                            <tr key={affiliate.id}>
                                <td>{affiliate.affiliate_name || affiliate.user?.email}</td>
                                <td>{affiliate.code}</td>
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={affiliate.commission_rate}
                                        onChange={(event) => updateAffiliate(affiliate, { commission_rate: Number(event.target.value) })}
                                    />
                                </td>
                                <td>{affiliate.clicks_count}</td>
                                <td>{affiliate.summary?.total_conversions || 0}</td>
                                <td>{formatPrice(affiliate.summary?.total_commission)}</td>
                                <td>
                                    <select value={affiliate.status} onChange={(event) => updateAffiliate(affiliate, { status: event.target.value })}>
                                        {AFFILIATE_PROFILE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
