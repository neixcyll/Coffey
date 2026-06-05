import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';

export default function SellerOrders({ token, navigate, setNotice, refreshSellerNotifications }) {
    const [orders, setOrders] = useState([]);
    const [expandedId, setExpandedId] = useState(null);

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
                    <SellerOrderCard
                        expanded={expandedId === order.id}
                        key={order.id}
                        navigate={navigate}
                        onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                        order={order}
                        updateStatus={updateStatus}
                    />
                ))}
                {orders.length === 0 && <p className="muted">Belum ada order untuk produk seller ini.</p>}
            </div>
        </section>
    );
}

function SellerOrderCard({ order, expanded, navigate, onToggle, updateStatus }) {
    const action = nextAction(order.next_status || nextStatusFor(order.seller_status || order.status));
    const sellerStatus = order.seller_status || order.status;

    return (
        <div className="panel order-panel">
            <div className="row between">
                <div>
                    <strong>{order.order_number}</strong>
                    <p className="muted">{order.customer_name} - status seller: {sellerStatus}</p>
                </div>
                <strong>{formatPrice(order.seller_total)}</strong>
            </div>

            {order.items.map((item) => (
                <p className="muted" key={item.id}>
                    {item.product_name}{item.variant_label ? ` (${item.variant_label})` : ''} x {item.quantity} - {item.status}
                </p>
            ))}

            {expanded && (
                <div className="seller-order-shipping-detail">
                    <div><small>Penerima</small><strong>{order.customer_name} - {order.customer_phone}</strong></div>
                    <div><small>Tujuan</small><strong>{order.shipping_address}, {order.destination_city || '-'}</strong></div>
                    <div><small>Pengiriman</small><strong>{order.courier || '-'} {order.shipping_service || ''} - {formatPrice(order.shipping_cost)}</strong></div>
                    <div><small>Estimasi</small><strong>{order.shipping_estimated_days || '-'}</strong></div>
                </div>
            )}

            <div className="row seller-order-actions">
                <button className="btn ghost" type="button" onClick={onToggle}>
                    {expanded ? 'Tutup detail' : 'Lihat detail'}
                </button>
                <button className="btn primary" type="button" onClick={() => navigate('seller-order-print', order.id)}>
                    Cetak Label Pengiriman
                </button>
                {sellerStatus === 'completed' ? (
                    <span className="badge seller-order-completed-badge">Completed</span>
                ) : action ? (
                    <button className="btn ghost" type="button" onClick={() => updateStatus(order, action.status)}>
                        {action.label}
                    </button>
                ) : (
                    <span className="badge">Menunggu pembayaran</span>
                )}
            </div>
        </div>
    );
}

function nextStatusFor(status) {
    return {
        pending: 'processing',
        processing: 'shipped',
        shipped: 'completed',
    }[status];
}

function nextAction(status) {
    return {
        processing: { status: 'processing', label: 'Process Order' },
        shipped: { status: 'shipped', label: 'Ship Order' },
        completed: { status: 'completed', label: 'Complete Order' },
    }[status];
}
