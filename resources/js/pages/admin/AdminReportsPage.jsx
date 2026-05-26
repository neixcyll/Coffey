import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import Stat from '../../components/common/Stat.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminReportsPage({ token, navigate, setNotice }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!token) return;
        apiRequest('/admin/reports', { token })
            .then((response) => setData(response.data))
            .catch((error) => setNotice(error.message));
    }, [token, setNotice]);

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-reports" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Reports" />
            {!data ? <p className="muted">Memuat reports...</p> : (
                <>
                    <div className="stats">
                        <Stat label="Revenue bulan ini" value={formatPrice(data.monthly_revenue)} />
                        <Stat label="Order bulan ini" value={data.monthly_orders} />
                        <Stat label="Customer baru" value={data.monthly_new_customers} />
                        <Stat label="Komisi affiliate" value={formatPrice(data.monthly_affiliate_commission)} />
                    </div>
                    <div className="admin-split">
                        <ReportTable title="Produk terlaris" rows={data.best_selling_products} nameKey="product_name" />
                        <ReportTable title="Seller top revenue" rows={data.top_sellers} nameKey="store_name" />
                        <ReportTable title="Affiliate top commission" rows={data.top_affiliates} nameKey="code" amountKey="total_commission" />
                    </div>
                </>
            )}
        </AdminLayout>
    );
}

function ReportTable({ title, rows, nameKey, amountKey = 'total_revenue' }) {
    return (
        <div className="panel">
            <h2>{title}</h2>
            <div className="table-wrap flat">
                <table>
                    <thead><tr><th>Nama</th><th>Order/Qty</th><th>Revenue</th></tr></thead>
                    <tbody>
                        {(rows || []).map((row, index) => (
                            <tr key={`${row[nameKey]}-${index}`}>
                                <td>{row[nameKey]}</td>
                                <td>{row.total_quantity || row.total_orders || 0}</td>
                                <td>{formatPrice(row[amountKey])}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
