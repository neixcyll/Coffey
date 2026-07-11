import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';

export default function CustomerOrders({ token, navigate, setNotice, selectedOrderId }) {
    const [orders, setOrders] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        setLoading(true);
        apiRequest('/orders', { token })
            .then((response) => setOrders(response.data || []))
            .catch((error) => setNotice(error.message))
            .finally(() => setLoading(false));
    }, [token, setNotice]);

    useEffect(() => {
        if (!selectedOrderId || orders.length === 0) return;

        const selected = orders.find((order) => String(order.id) === String(selectedOrderId));
        if (selected) setExpandedId(selected.id);
    }, [orders, selectedOrderId]);

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section className="customer-orders-page">
            <div className="customer-section-head">
                <div>
                    <p className="eyebrow">Order Saya</p>
                    <h2>Orders kopi kamu</h2>
                    <p className="muted">Cek status order, pembayaran, produk, dan review dari satu tempat.</p>
                </div>
                <button className="btn primary" type="button" onClick={() => navigate('blog')}>Belanja lagi</button>
            </div>

            <div className="customer-order-list">
                {orders.map((order) => (
                    <CustomerOrderCard
                        expanded={expandedId === order.id}
                        key={order.id}
                        navigate={navigate}
                        onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                        order={order}
                    />
                ))}

                {!loading && orders.length === 0 && (
                    <div className="panel customer-empty-state">
                        <span>K</span>
                        <div>
                            <h3>Belum ada order</h3>
                            <p className="muted">Products kopi yang kamu checkout akan tampil di halaman ini.</p>
                        </div>
                        <button className="btn primary" type="button" onClick={() => navigate('blog')}>Mulai belanja</button>
                    </div>
                )}

                {loading && <div className="panel customer-loading">Memuat order kamu...</div>}
            </div>
        </section>
    );
}

function CustomerOrderCard({ order, expanded, navigate, onToggle }) {
    const reviewedProductIds = new Set((order.product_reviews || []).map((review) => Number(review.product_id)));

    return (
        <article className="customer-order-card">
            <div className="customer-order-card-head">
                <div>
                    <small>Nomor order</small>
                    <strong>{order.order_number}</strong>
                    <span>{new Date(order.created_at).toLocaleString('id-ID')}</span>
                </div>
                <div className="customer-order-statuses">
                    <Status label="Order" value={order.status} />
                    <Status label="Payment" value={order.payment?.status || 'pending'} />
                </div>
            </div>

            <div className="customer-order-card-body">
                <div>
                    <small>Products dibeli</small>
                    <strong>{primaryProduct(order)}</strong>
                    <span>{(order.items || []).length} produk dalam order</span>
                </div>
                <div>
                    <small>Total pembayaran</small>
                    <strong className="customer-order-total">{formatPrice(order.total_amount)}</strong>
                </div>
                <button className="btn ghost compact-btn" type="button" onClick={onToggle}>
                    {expanded ? 'Tutup detail' : 'Lihat detail'}
                </button>
            </div>

            {expanded && (
                <div className="customer-order-detail">
                    {(order.items || []).map((item) => {
                        const canReview = order.status === 'completed'
                            && item.product_id
                            && !reviewedProductIds.has(Number(item.product_id));

                        return (
                            <div className="customer-order-product" key={item.id}>
                                <div className="customer-order-product-main">
                                    <div className="customer-order-product-image">
                                        <img 
                                            src={item.product?.image_url || '/images/placeholder.png'} 
                                            alt={item.product_name}
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="customer-order-product-info">
                                        <div className="customer-order-product-title-row">
                                            <div className="customer-order-product-name-col">
                                                <strong>{item.product_name}{item.variant_label ? ` (${item.variant_label})` : ''}</strong>
                                                <p className="customer-order-product-desc muted">{item.product?.short_description || item.product?.description || 'Tidak ada deskripsi'}</p>
                                            </div>
                                            <div className="customer-order-product-actions">
                                                {canReview && (
                                                    <button className="btn ghost compact-btn" type="button" onClick={() => navigate('product', item.product?.slug || item.product_id)}>
                                                        Tulis Review
                                                    </button>
                                                )}
                                                {!canReview && reviewedProductIds.has(Number(item.product_id)) && <span className="badge">Sudah direview</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="customer-order-product-purchase-info">
                                    <div className="purchase-info-item">
                                        <small>Weight</small>
                                        <span>{item.weight_grams ? `${item.weight_grams}g` : '-'}</span>
                                    </div>
                                    <div className="purchase-info-item">
                                        <small>Grind Level</small>
                                        <span>{item.grind_size || '-'}</span>
                                    </div>
                                    <div className="purchase-info-item">
                                        <small>Quantity</small>
                                        <span>{item.quantity}</span>
                                    </div>
                                    <div className="purchase-info-item">
                                        <small>Subtotal</small>
                                        <span>{formatPrice(item.subtotal)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {order.payment && (
                        <p className="muted customer-payment-note">
                            Payment status: {order.payment.status}{order.payment.payment_type ? ` via ${order.payment.payment_type}` : ''}
                        </p>
                    )}
                </div>
            )}
        </article>
    );
}

function Status({ label, value }) {
    return (
        <span className="customer-status">
            <small>{label}</small>
            <strong className={`content-status ${statusClass(value)}`}>{value}</strong>
        </span>
    );
}

function primaryProduct(order) {
    const first = order.items?.[0];
    if (!first) return '-';

    const rest = Math.max(0, (order.items || []).length - 1);
    return `${first.product_name}${rest ? ` +${rest} produk lainnya` : ''}`;
}

function statusClass(status) {
    if (['completed', 'paid', 'settlement', 'capture'].includes(status)) return 'published';
    if (['pending', 'processing', 'shipped'].includes(status)) return 'pending';
    if (['cancelled', 'failed', 'expired', 'deny'].includes(status)) return 'rejected';

    return 'draft';
}
