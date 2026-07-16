import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Stat from '../../components/common/Stat.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminDashboardPage({ token, navigate, setNotice, user, logout, notice }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!token) return;
        apiRequest('/admin/dashboard', { token })
            .then((response) => setData(response.data))
            .catch((error) => setNotice(error.message));
    }, [token, setNotice]);

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-dashboard" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageHeader 
                title="Marketplace Overview" 
                description="Pantau performa marketplace Anda secara real-time."
            >
                <button className="text-sm font-semibold px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
                    Generate Report
                </button>
            </PageHeader>

            {!data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
                </div>
            ) : (
                <div className="space-y-8">
                    {/* KPI Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Stat label="Total Revenue" value={formatPrice(data.total_revenue)} />
                        <Stat label="Total Orders" value={data.total_orders} />
                        <Stat label="Active Sellers" value={data.total_sellers} />
                        <Stat label="Active Customers" value={data.total_customers} />
                        <Stat label="Pending Orders" value={data.pending_orders} />
                        <Stat label="Products" value={data.total_products} />
                        <Stat label="Users" value={data.total_users} />
                        <Stat label="Pending Approvals" value={data.pending_seller_approvals} />
                    </div>

                    {/* Widget Area - Placeholders for charts/feeds */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                            <h2 className="text-lg font-bold text-black mb-4">Marketplace Growth</h2>
                            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg text-gray-400">
                                [Chart Placeholder]
                            </div>
                        </div>
                        <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
                            <h2 className="text-lg font-bold text-black mb-4">Aktivitas Terkini</h2>
                            <div className="text-sm text-gray-500">
                                Belum ada aktivitas terbaru untuk ditampilkan.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
