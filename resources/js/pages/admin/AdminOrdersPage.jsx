import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { ORDER_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminOrdersPage({ token, navigate, setNotice, user, logout, notice }) {
    const [orders, setOrders] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [filters, setFilters] = useState({ status: '', seller_id: '' });
    const [search, setSearch] = useState('');

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

    const filteredOrders = orders.filter(o => 
        o.order_number?.toLowerCase().includes(search.toLowerCase()) || 
        o.customer_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout current="admin-orders" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageHeader 
                title="Order Monitoring" 
                description="Lacak semua transaksi yang terjadi di marketplace, filter berdasarkan status dan seller."
            />

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="    Cari pesanan berdasarkan nomor order atau nama customer..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <select 
                        value={filters.status} 
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-black"
                    >
                        <option value="">Semua Status</option>
                        {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                    <select 
                        value={filters.seller_id} 
                        onChange={(e) => setFilters({ ...filters, seller_id: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-black"
                    >
                        <option value="">Semua Seller</option>
                        {sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.store_name}</option>)}
                    </select>
                </div>
            </div>
            
            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                <th className="px-6 py-4">Order</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Seller</th>
                                <th className="px-6 py-4">Item</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                                        Tidak menemukan data pesanan.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold text-black font-mono">{order.order_number}</td>
                                        <td className="px-6 py-4">
                                            <span className="block text-sm font-semibold text-black">{order.user?.name || order.customer_name}</span>
                                            <span className="block text-xs text-gray-500">{order.user?.email}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {[...new Set(order.items?.map((item) => item.seller?.store_name).filter(Boolean))].join(', ')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-black">{order.items?.length || 0}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-black">{formatPrice(order.total_amount)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                                                order.status === 'completed' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                order.status === 'shipped' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                order.status === 'processing' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                                                order.status === 'pending' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                                                'bg-red-50 text-red-800 border border-red-200'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
