import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Stat from '../../components/common/Stat.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminReportsPage({ token, navigate, setNotice, user, logout, notice }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!token) return;
        apiRequest('/admin/reports', { token })
            .then((response) => setData(response.data))
            .catch((error) => setNotice(error.message));
    }, [token, setNotice]);

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-reports" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageHeader 
                title="Business Reports" 
                description="Laporan performa marketplace bulan ini, produk terlaris, dan performa afiliasi."
            />

            {!data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Stat label="Revenue Bulan Ini" value={formatPrice(data.monthly_revenue)} />
                        <Stat label="Order Bulan Ini" value={data.monthly_orders} />
                        <Stat label="Customer Baru" value={data.monthly_new_customers} />
                        <Stat label="Komisi Afiliasi" value={formatPrice(data.monthly_affiliate_commission)} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <ReportTable title="Top Products" rows={data.best_selling_products} nameKey="product_name" />
                        <ReportTable title="Top Sellers" rows={data.top_sellers} nameKey="store_name" />
                        <ReportTable title="Top Affiliates" rows={data.top_affiliates} nameKey="code" amountKey="total_commission" />
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

function ReportTable({ title, rows, nameKey, amountKey = 'total_revenue' }) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-sm font-bold text-black">{title}</h2>
            </div>
            <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                            <th className="px-6 py-3">Nama</th>
                            <th className="px-6 py-3">Qty/Ord</th>
                            <th className="px-6 py-3 text-right">Pendapatan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {(!rows || rows.length === 0) ? (
                            <tr>
                                <td colSpan="3" className="px-6 py-8 text-center text-xs text-gray-500">Belum ada data.</td>
                            </tr>
                        ) : (
                            rows.map((row, index) => (
                                <tr key={`${row[nameKey]}-${index}`} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-3">
                                        <span className="block font-semibold text-black text-xs line-clamp-1">{row[nameKey]}</span>
                                    </td>
                                    <td className="px-6 py-3 text-xs text-gray-500">{row.total_quantity || row.total_orders || 0}</td>
                                    <td className="px-6 py-3 text-right text-xs font-semibold text-black">{formatPrice(row[amountKey])}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
