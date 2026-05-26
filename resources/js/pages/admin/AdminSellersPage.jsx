import { useEffect, useState } from 'react';
import DetailPanel from '../../components/common/DetailPanel.jsx';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import { SELLER_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminSellersPage({ token, navigate, setNotice }) {
    const [sellers, setSellers] = useState([]);
    const [status, setStatus] = useState('');
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        if (!token) return;
        loadSellers();
    }, [token, status]);

    async function loadSellers() {
        const query = status ? `?status=${status}` : '';
        const response = await apiRequest(`/admin/sellers${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setSellers(rowsFrom(response));
    }

    async function sellerAction(seller, action) {
        try {
            await apiRequest(`/admin/sellers/${seller.id}/${action}`, { method: 'POST', token });
            setNotice('Status seller diperbarui.');
            loadSellers();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function showSeller(seller) {
        const response = await apiRequest(`/admin/sellers/${seller.id}`, { token }).catch((error) => {
            setNotice(error.message);
            return null;
        });
        if (response) setDetail(response.data);
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-sellers" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Seller management" />
            <div className="filters compact">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">Semua status</option>
                    {SELLER_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Toko</th><th>User</th><th>Status</th><th>Produk</th><th>Order</th><th>Revenue</th><th>Aksi</th></tr></thead>
                    <tbody>
                        {sellers.map((seller) => (
                            <tr key={seller.id}>
                                <td>{seller.store_name}</td>
                                <td>{seller.user?.email}</td>
                                <td>{seller.status}</td>
                                <td>{seller.products_count}</td>
                                <td>{seller.total_orders}</td>
                                <td>{formatPrice(seller.total_revenue)}</td>
                                <td className="actions">
                                    <button className="btn ghost" onClick={() => showSeller(seller)}>Detail</button>
                                    <button className="btn ghost" onClick={() => sellerAction(seller, 'approve')}>Approve</button>
                                    <button className="btn ghost" onClick={() => sellerAction(seller, 'reject')}>Reject</button>
                                    <button className="btn danger" onClick={() => sellerAction(seller, 'suspend')}>Suspend</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {detail && <DetailPanel title={detail.store_name} rows={[
                ['Pemilik', detail.user?.name],
                ['Email', detail.user?.email],
                ['Telepon', detail.phone || '-'],
                ['Status', detail.status],
                ['Total produk', detail.products_count],
                ['Total order', detail.total_orders],
                ['Revenue', formatPrice(detail.total_revenue)],
            ]} />}
        </AdminLayout>
    );
}
