import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Dropdown from '../../components/admin/Dropdown.jsx';
import { PAYMENT_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminPaymentsPage({ token, navigate, setNotice, user, logout, notice }) {
    const [payments, setPayments] = useState([]);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!token) return;
        loadPayments();
    }, [token, status]);

    async function loadPayments() {
        const query = status ? `?status=${status}` : '';
        const response = await apiRequest(`/admin/payments${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setPayments(rowsFrom(response));
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    const filteredPayments = payments.filter(p => 
        p.gateway_order_id?.toLowerCase().includes(search.toLowerCase()) || 
        p.transaction_id?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout current="admin-payments" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageHeader 
                title="Payment Monitoring" 
                description="Pantau seluruh transaksi pembayaran, status gateway, dan data pendukung lainnya."
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="    Cari transaksi..."
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
                <div>
                    <Dropdown
                        value={status}
                        onChange={setStatus}
                        options={[{ value: '', label: 'Semua Status' }, ...PAYMENT_STATUSES.map((item) => ({ value: item, label: item }))]}
                        ariaLabel="Filter status"
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Transaction</th>
                                <th className="px-6 py-4">Method</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Paid at</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                                        Tidak menemukan data pembayaran.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold text-black font-mono">{payment.gateway_order_id}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-mono">{payment.transaction_id || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-black">{payment.payment_type || payment.payment_gateway}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                                                payment.status === 'paid' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                payment.status === 'pending' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                                                'bg-red-50 text-red-800 border border-red-200'
                                            }`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-black">{formatPrice(payment.amount)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {payment.paid_at ? new Date(payment.paid_at).toLocaleString('id-ID') : '-'}
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
