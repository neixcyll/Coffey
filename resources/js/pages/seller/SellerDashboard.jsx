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
    if (!data) return <p className="muted">Memuat dashboard...</p>;

    const maxRevenue = Math.max(...(data.revenue_traffic || []).map((item) => Number(item.revenue || 0)), 1);

    return (
        <section>
            <p className="eyebrow">Seller dashboard</p>
            <h1>{data.seller.store_name}</h1>
            <div className="stats">
                <Stat label="Revenue" value={formatPrice(data.total_revenue)} />
                <Stat label="Orders" value={data.total_orders} />
                <Stat label="Products" value={data.total_products} />
                <Stat label="Rating" value={data.average_rating ? Number(data.average_rating).toLocaleString('id-ID', { maximumFractionDigits: 1 }) : '-'} />
            </div>
            <div className="panel revenue-panel">
                <div className="section-head">
                    <div>
                        <p className="eyebrow">Traffic pendapatan</p>
                        <h2>Revenue 14 hari terakhir</h2>
                    </div>
                </div>
                <div className="revenue-chart">
                    {(data.revenue_traffic || []).map((item) => (
                        <div className="revenue-bar" key={item.date}>
                            <div className="bar-track">
                                <span style={{ height: `${Math.max(6, (Number(item.revenue || 0) / maxRevenue) * 100)}%` }} />
                            </div>
                            <small>{new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</small>
                            <strong>{formatPrice(item.revenue)}</strong>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
