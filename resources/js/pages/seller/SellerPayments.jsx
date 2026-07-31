import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';

export default function SellerPayments({ token, navigate, setNotice }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!token) return;
        apiRequest('/seller/payments', { token })
            .then((response) => setData(response.data))
            .catch(() => setData({ pending: 0, settled: 0, history: [] }));
    }, [token]);

    if (!token) return <NeedLogin navigate={navigate} />;
    if (!data) return <p className="text-gray-500 p-6 animate-pulse">Memuat data pembayaran...</p>;

    return (
        <section className="p-6 md:p-8 max-w-6xl mx-auto w-full">
            <div className="mb-6">
                <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">Seller Payments</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-black tracking-tight">Pembayaran & Payout</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Saldo Tersedia</p>
                    <strong className="text-2xl font-bold text-gray-900">{formatPrice(data.settled || 0)}</strong>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pending Settlement</p>
                    <strong className="text-2xl font-bold text-gray-900">{formatPrice(data.pending || 0)}</strong>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Paid Out</p>
                    <strong className="text-2xl font-bold text-gray-900">{formatPrice(data.total_paid || 0)}</strong>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-sm font-bold text-gray-900">Riwayat Pembayaran</h2>
                </div>
                {data.history?.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                    <th className="px-5 py-3 font-semibold">Tanggal</th>
                                    <th className="px-5 py-3 font-semibold">Order</th>
                                    <th className="px-5 py-3 font-semibold">Jumlah</th>
                                    <th className="px-5 py-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.history.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50">
                                        <td className="px-5 py-3 text-sm text-gray-900">{item.date}</td>
                                        <td className="px-5 py-3 text-sm font-semibold text-gray-900">{item.order_number || '-'}</td>
                                        <td className="px-5 py-3 text-sm font-bold text-gray-900">{formatPrice(item.amount)}</td>
                                        <td className="px-5 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                item.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                                            }`}>{item.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-10 text-center">
                        <p className="text-sm text-gray-500 font-medium">Belum ada riwayat pembayaran.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
