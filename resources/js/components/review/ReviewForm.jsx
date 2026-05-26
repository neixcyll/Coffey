import { useState } from 'react';
import { apiRequest } from '../../services/api.js';
import StarRating from './StarRating.jsx';

export default function ReviewForm({ product, token, eligibleOrders, onSubmitted, setNotice }) {
    const [orderId, setOrderId] = useState(eligibleOrders[0]?.id || '');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [images, setImages] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(0);

    async function submitReview(event) {
        event.preventDefault();
        setSubmitting(true);

        const formData = new FormData();
        formData.append('order_id', orderId);
        formData.append('rating', rating);
        formData.append('comment', comment);
        images.forEach((image) => formData.append('images[]', image));

        try {
            const response = await apiRequest(`/products/${product.slug || product.id}/reviews`, {
                method: 'POST',
                token,
                body: formData,
                isForm: true,
            });

            setComment('');
            setImages([]);
            setRating(5);
            setFileInputKey((current) => current + 1);
            setNotice?.(response.message || 'Review berhasil dikirim.');
            onSubmitted?.(response.data);
        } catch (error) {
            setNotice?.(error.message);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <form className="review-form" onSubmit={submitReview}>
            {eligibleOrders.length > 1 && (
                <label>
                    <span>Order completed</span>
                    <select value={orderId} onChange={(event) => setOrderId(event.target.value)} required>
                        {eligibleOrders.map((order) => (
                            <option key={order.id} value={order.id}>
                                {order.order_number} - {new Date(order.completed_at || order.created_at).toLocaleDateString('id-ID')}
                            </option>
                        ))}
                    </select>
                </label>
            )}
            {eligibleOrders.length === 1 && (
                <p className="muted">Order: {eligibleOrders[0].order_number}</p>
            )}
            <label>
                <span>Rating</span>
                <StarRating value={rating} onChange={setRating} size="large" />
            </label>
            <label>
                <span>Komentar</span>
                <textarea
                    rows="4"
                    value={comment}
                    minLength={10}
                    placeholder="Ceritakan rasa, aroma, packaging, atau pengalaman seduh kopi ini."
                    onChange={(event) => setComment(event.target.value)}
                    required
                />
            </label>
            <label>
                <span>Gambar review (opsional)</span>
                <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => setImages(Array.from(event.target.files || []).slice(0, 5))}
                />
            </label>
            <button className="btn primary" type="submit" disabled={submitting || !orderId}>
                {submitting ? 'Mengirim...' : 'Submit Review'}
            </button>
        </form>
    );
}
