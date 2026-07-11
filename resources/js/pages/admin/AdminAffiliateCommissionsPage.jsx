import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import { AFFILIATE_COMMISSION_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminAffiliateCommissionsPage({ token, navigate, setNotice, user, logout, notice }) {
    const [commissions, setCommissions] = useState([]);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (!token) return;
        loadCommissions();
    }, [token, status]);

    async function loadCommissions() {
        const query = status ? `?status=${status}` : '';
        const response = await apiRequest(`/admin/affiliate-commissions${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setCommissions(rowsFrom(response));
    }

    async function updateCommission(commission, nextStatus) {
        try {
            await apiRequest(`/admin/affiliate-commissions/${commission.id}`, { method: 'PATCH', token, body: { status: nextStatus } });
            setNotice('Status komisi diperbarui.');
            loadCommissions();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-affiliate-commissions" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageTitle eyebrow="Admin" title="Affiliate commissions" />
            <div className="filters compact">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">Semua status</option>
                    {AFFILIATE_COMMISSION_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Affiliate</th><th>Order</th><th>Products</th><th>Seller</th><th>Subtotal</th><th>Commissions</th><th>Status</th></tr></thead>
                    <tbody>
                        {commissions.map((commission) => (
                            <tr key={commission.id}>
                                <td>{commission.affiliate_profile?.code} - {commission.affiliate_profile?.user?.email}</td>
                                <td>{commission.order?.order_number}</td>
                                <td>{commission.product?.name || '-'}</td>
                                <td>{commission.seller?.store_name || '-'}</td>
                                <td>{formatPrice(commission.amount)}</td>
                                <td>{formatPrice(commission.commission_amount)}</td>
                                <td>
                                    <select value={commission.status} onChange={(event) => updateCommission(commission, event.target.value)}>
                                        {AFFILIATE_COMMISSION_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
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
