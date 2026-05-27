import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import { PAYMENT_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminPaymentsPage({ token, navigate, setNotice, user, logout, notice }) {
    const [payments, setPayments] = useState([]);
    const [status, setStatus] = useState('');

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

    return (
        <AdminLayout current="admin-payments" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageTitle eyebrow="Admin" title="Payment monitoring" />
            <div className="filters compact">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">Semua status</option>
                    {PAYMENT_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Order ID</th><th>Transaction</th><th>Method</th><th>Status</th><th>Gross amount</th><th>Paid at</th></tr></thead>
                    <tbody>
                        {payments.map((payment) => (
                            <tr key={payment.id}>
                                <td>{payment.gateway_order_id}</td>
                                <td>{payment.transaction_id || '-'}</td>
                                <td>{payment.payment_type || payment.payment_gateway}</td>
                                <td>{payment.status}</td>
                                <td>{formatPrice(payment.amount)}</td>
                                <td>{payment.paid_at ? new Date(payment.paid_at).toLocaleString('id-ID') : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
