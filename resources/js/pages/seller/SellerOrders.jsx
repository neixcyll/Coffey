import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';

export default function SellerOrders({ token, navigate, setNotice, refreshSellerNotifications }) {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!token) return;
        loadOrders();
    }, [token]);

    async function loadOrders() {
        const data = await apiRequest('/seller/orders', { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setOrders(data.data || []);
    }

    async function updateStatus(order, status) {
        try {
            await apiRequest(`/seller/orders/${order.id}/status`, { method: 'PATCH', token, body: { status } });
            setNotice(`Order ${order.order_number} menjadi ${status}.`);
            await loadOrders();
            refreshSellerNotifications?.();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section>
            <p className="eyebrow">Order seller</p>
            <h1>Order masuk</h1>
            <div className="stack">
                {orders.map((order) => (
                    <div className="panel order-panel" key={order.id}>
                        <div className="row between">
                            <div>
                                <strong>{order.order_number}</strong>
                                <p className="muted">{order.customer_name} - {order.status}</p>
                            </div>
                            <strong>{formatPrice(order.seller_total)}</strong>
                        </div>
                        {order.items.map((item) => (
                            <p className="muted" key={item.id}>{item.product_name} x {item.quantity} - {item.status}</p>
                        ))}
                        <div className="row">
                            {['processing', 'shipped', 'completed'].map((status) => (
                                <button className="btn ghost" key={status} onClick={() => updateStatus(order, status)}>{status}</button>
                            ))}
                        </div>
                    </div>
                ))}
                {orders.length === 0 && <p className="muted">Belum ada order untuk produk seller ini.</p>}
            </div>
        </section>
    );
}
