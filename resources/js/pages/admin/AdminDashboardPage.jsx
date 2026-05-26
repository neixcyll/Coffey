import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import Stat from '../../components/common/Stat.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminDashboardPage({ token, navigate, setNotice }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!token) return;
        apiRequest('/admin/dashboard', { token })
            .then((response) => setData(response.data))
            .catch((error) => setNotice(error.message));
    }, [token, setNotice]);

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-dashboard" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Dashboard" />
            {!data ? <p className="muted">Memuat admin dashboard...</p> : (
                <div className="stats">
                    <Stat label="Total users" value={data.total_users} />
                    <Stat label="Customers" value={data.total_customers} />
                    <Stat label="Sellers" value={data.total_sellers} />
                    <Stat label="Products" value={data.total_products} />
                    <Stat label="Orders" value={data.total_orders} />
                    <Stat label="Revenue" value={formatPrice(data.total_revenue)} />
                    <Stat label="Pending orders" value={data.pending_orders} />
                    <Stat label="Seller approvals" value={data.pending_seller_approvals} />
                    <Stat label="Affiliates" value={data.total_affiliates} />
                    <Stat label="Pending commissions" value={data.pending_affiliate_commissions} />
                    <Stat label="Affiliate amount" value={formatPrice(data.affiliate_commission_amount)} />
                    <Stat label="Articles" value={data.total_articles} />
                    <Stat label="Published articles" value={data.published_articles} />
                    <Stat label="Pending articles" value={data.pending_articles} />
                </div>
            )}
        </AdminLayout>
    );
}
