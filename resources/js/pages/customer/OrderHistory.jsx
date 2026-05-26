import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import OrderCard from '../../components/order/OrderCard.jsx';
import { apiRequest } from '../../services/api.js';

export default function OrderHistory({ token, navigate, setNotice }) {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!token) return;
        apiRequest('/orders', { token })
            .then((data) => setOrders(data.data || []))
            .catch((error) => setNotice(error.message));
    }, [token, setNotice]);

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section>
            <div className="section-head">
                <div>
                    <p className="eyebrow">Order</p>
                    <h1>Riwayat order</h1>
                </div>
            </div>
            <div className="stack">
                {orders.map((order) => <OrderCard key={order.id} order={order} navigate={navigate} />)}
                {orders.length === 0 && <p className="muted">Belum ada order.</p>}
            </div>
        </section>
    );
}
