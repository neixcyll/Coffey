import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import Stat from '../../components/common/Stat.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';

export default function SellerDashboard({ token, navigate, setNotice }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!token) return;
        apiRequest('/seller/dashboard', { token })
            .then((response) => setData(response.data))
            .catch((error) => setNotice(error.message));
    }, [token, setNotice]);

    if (!token) return <NeedLogin navigate={navigate} />;
    if (!data) return <p className="text-gray-500 p-6 animate-pulse">Memuat dashboard...</p>;

    const maxRevenue = Math.max(...(data.revenue_traffic || []).map((item) => Number(item.revenue || 0)), 1);

    return (
        <section className="p-6 md:p-8 max-w-7xl mx-auto w-full">
            <div className="mb-8">
                <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase mb-1">Seller Dashboard</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">{data.seller.store_name}</h1>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Stat label="Total Pendapatan" value={formatPrice(data.total_revenue)} />
                <Stat label="Total Pesanan" value={data.total_orders} />
                <Stat label="Pesanan Pending" value={data.pending_orders} />
                <Stat label="Total Produk" value={data.total_products} />
                <Stat label="Rating Rata-rata" value={data.average_rating ? Number(data.average_rating).toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '-'} />
            </div>

            <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">Traffic Pendapatan</p>
                        <h2 className="text-lg font-bold text-gray-900 m-0">Revenue 14 Hari Terakhir</h2>
                    </div>
                </div>
                <div className="p-6">
                    <div className="flex items-end justify-between gap-2 h-48">
                        {(data.revenue_traffic || []).map((item) => (
                            <div className="flex flex-col items-center gap-2 group w-full" key={item.date}>
                                <div className="w-full relative h-full bg-gray-50/50 rounded-t-sm overflow-hidden flex items-end">
                                    <span 
                                        className="w-full bg-black transition-all duration-500 rounded-t-sm group-hover:bg-gray-800" 
                                        style={{ height: `${Math.max(6, (Number(item.revenue || 0) / maxRevenue) * 100)}%` }} 
                                    />
                                    {/* Tooltip */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                                        {formatPrice(item.revenue)}
                                    </div>
                                </div>
                                <small className="text-[10px] text-gray-400 font-medium tracking-tighter whitespace-nowrap hidden sm:block">
                                    {new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                </small>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
