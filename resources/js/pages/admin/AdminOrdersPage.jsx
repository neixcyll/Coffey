import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import { ORDER_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminOrdersPage({ token, navigate, setNotice, user, logout, notice }) {
    const [orders, setOrders] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [filters, setFilters] = useState({ status: '', seller_id: '' });

    useEffect(() => {
        if (!token) return;
        apiRequest('/admin/sellers', { token }).then((response) => setSellers(rowsFrom(response))).catch(() => {});
    }, [token]);

    useEffect(() => {
        if (!token) return;
        loadOrders();
    }, [token, filters.status, filters.seller_id]);

    async function loadOrders() {
        const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
        const response = await apiRequest(`/admin/orders?${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setOrders(rowsFrom(response));
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-orders" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageTitle eyebrow="Admin" title="Order monitoring" />
            <div className="filters compact">
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                    <option value="">Semua status</option>
                    {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <select value={filters.seller_id} onChange={(event) => setFilters({ ...filters, seller_id: event.target.value })}>
                    <option value="">Semua seller</option>
                    {sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.store_name}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Order</th><th>Customer</th><th>Seller</th><th>Item</th><th>Total</th><th>Status</th></tr></thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td>{order.order_number}</td>
                                <td>{order.user?.email || order.customer_name}</td>
                                <td>{[...new Set(order.items?.map((item) => item.seller?.store_name).filter(Boolean))].join(', ')}</td>
                                <td>{order.items?.length || 0}</td>
                                <td>{formatPrice(order.total_amount)}</td>
                                <td>{order.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
