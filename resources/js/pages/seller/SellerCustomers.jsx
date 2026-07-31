import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';

export default function SellerCustomers({ token, navigate, setNotice }) {
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        if (!token) return;
        apiRequest('/seller/customers', { token })
            .then((response) => setCustomers(response.data || []))
            .catch(() => setCustomers([]));
    }, [token]);

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section className="p-6 md:p-8 max-w-6xl mx-auto w-full">
            <div className="mb-6">
                <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">Seller Customers</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-black tracking-tight">Pelanggan</h1>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {customers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider text-gray-500 font-semibold bg-gray-50 border-b border-gray-200">
                                    <th className="px-5 py-3 font-semibold">Pelanggan</th>
                                    <th className="px-5 py-3 font-semibold">Total Order</th>
                                    <th className="px-5 py-3 font-semibold">Total Belanja</th>
                                    <th className="px-5 py-3 font-semibold">Terakhir Order</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-5 py-3">
                                            <span className="font-semibold text-gray-900">{customer.name}</span>
                                            <small className="block text-gray-500 text-xs">{customer.email}</small>
                                        </td>
                                        <td className="px-5 py-3 text-sm font-bold text-gray-900">{customer.total_orders || 0}</td>
                                        <td className="px-5 py-3 text-sm font-bold text-gray-900">{formatPrice(customer.total_spent || 0)}</td>
                                        <td className="px-5 py-3 text-sm text-gray-600">
                                            {customer.last_order_date ? new Date(customer.last_order_date).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-10 text-center">
                        <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Belum ada pelanggan.</p>
                        <p className="text-xs text-gray-400 mt-1">Pelanggan akan muncul setelah ada order masuk.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
