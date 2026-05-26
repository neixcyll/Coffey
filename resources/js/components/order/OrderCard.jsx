import { formatPrice } from '../../utils/format.js';

export default function OrderCard({ order, navigate }) {
    const reviewedProductIds = new Set((order.product_reviews || []).map((review) => Number(review.product_id)));
    const canReviewOrder = order.status === 'completed';

    return (
        <div className="panel order-panel">
            <div className="row between">
                <div>
                    <strong>{order.order_number}</strong>
                    <p className="muted">{order.status} - {new Date(order.created_at).toLocaleString('id-ID')}</p>
                </div>
                <strong>{formatPrice(order.total_amount)}</strong>
            </div>
            {order.items?.map((item) => (
                <div className="order-item-review-row" key={item.id}>
                    <p className="muted">{item.product_name} x {item.quantity} - {item.status}</p>
                    {canReviewOrder && item.status === 'completed' && item.product_id && (
                        reviewedProductIds.has(Number(item.product_id)) ? (
                            <span className="badge">Sudah direview</span>
                        ) : (
                            <button className="btn ghost compact-btn" onClick={() => navigate?.('product', item.product?.slug || item.product_id)}>
                                Tulis Review
                            </button>
                        )
                    )}
                </div>
            ))}
            {order.payment && <p className="muted">Payment: {order.payment.status} {order.payment.payment_type ? `via ${order.payment.payment_type}` : ''}</p>}
        </div>
    );
}
