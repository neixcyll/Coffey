import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';

export default function SellerOrders({ token, navigate, setNotice, refreshSellerNotifications }) {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!token) return;
        loadOrders();
    }, [token]);

    async function loadOrders() {
        const data = await apiRequest('/seller/orders', { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setOrders(data.data || []);
    }

    async function updateStatus(order, status) {
        try {
            await apiRequest(`/seller/orders/${order.id}/status`, { method: 'PATCH', token, body: { status } });
            setNotice(`Order ${order.order_number} berhasil diperbarui.`);
            await loadOrders();
            refreshSellerNotifications?.();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section className="p-6 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase mb-1">Seller Orders</p>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">Manajemen Pesanan</h1>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {orders.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Belum ada pesanan</h3>
                        <p className="text-gray-500 mt-1 max-w-xs mx-auto">Saat ini belum ada pesanan baru. Terus tingkatkan performa toko Anda!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                    <th className="px-6 py-4 font-semibold">No. Pesanan</th>
                                    <th className="px-6 py-4 font-semibold">Pelanggan</th>
                                    <th className="px-6 py-4 font-semibold">Total</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-center w-40">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.map((order) => (
                                    <SellerOrderRow key={order.id} order={order} updateStatus={updateStatus} navigate={navigate} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}

function SellerOrderRow({ order, updateStatus, navigate }) {
    const action = nextAction(order.next_status || nextStatusFor(order.seller_status || order.status));
    const status = order.seller_status || order.status;

    return (
        <tr className="hover:bg-gray-50/50 transition-colors">
            <td className="px-6 py-4 font-bold text-gray-900">{order.order_number}</td>
            <td className="px-6 py-4">
                <span className="block font-semibold text-gray-900">{order.customer_name}</span>
                <small className="text-gray-500">{order.customer_phone}</small>
            </td>
            <td className="px-6 py-4 font-bold text-gray-900">{formatPrice(order.seller_total)}</td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    status === 'completed' ? 'bg-green-100 text-green-700' : 
                    status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                }`}>
                    {status}
                </span>
            </td>
            <td className="px-6 py-4 text-center">
                <div className="flex flex-col gap-2">
                    <button className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors" onClick={() => navigate('seller-order-print', order.id)}>
                        Cetak Label
                    </button>
                    {action && (
                        <button className="px-3 py-1.5 text-xs font-semibold text-white bg-black rounded-md hover:bg-gray-800 transition-colors" onClick={() => updateStatus(order, action.status)}>
                            {action.label}
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}

function nextStatusFor(status) {
    return {
        pending: 'processing',
        processing: 'shipped',
        shipped: 'completed',
    }[status];
}

function nextAction(status) {
    return {
        processing: { status: 'processing', label: 'Proses' },
        shipped: { status: 'shipped', label: 'Kirim' },
        completed: { status: 'completed', label: 'Selesai' },
    }[status];
}
