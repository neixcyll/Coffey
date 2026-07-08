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
        <form className="review-form grid gap-4 max-w-[560px]" onSubmit={submitReview}>
            {eligibleOrders.length > 1 && (
                <label className="grid gap-1.5">
                    <span className="block mb-1.5 text-[#4d4035] text-[0.86rem] font-bold">Order completed</span>
                    <select 
                        value={orderId} 
                        onChange={(event) => setOrderId(event.target.value)} 
                        required
                        className="w-full border border-[#d8cbbc] rounded-lg px-3 py-2.5 bg-[#fffdf9] color-[#261c15] focus:outline-none focus:ring-2 focus:ring-[#5b3825] focus:border-transparent transition-all"
                    >
                        {eligibleOrders.map((order) => (
                            <option key={order.id} value={order.id}>
                                {order.order_number} - {new Date(order.completed_at || order.created_at).toLocaleDateString('id-ID')}
                            </option>
                        ))}
                    </select>
                </label>
            )}
            {eligibleOrders.length === 1 && (
                <p className="muted text-[#75695d] text-sm">Order: <strong className="text-gray-900">{eligibleOrders[0].order_number}</strong></p>
            )}
            <label className="grid gap-1.5">
                <span className="block mb-1.5 text-[#4d4035] text-[0.86rem] font-bold">Rating</span>
                <div className="flex items-center">
                    <StarRating value={rating} onChange={setRating} size="large" />
                </div>
            </label>
            <label className="grid gap-1.5">
                <span className="block mb-1.5 text-[#4d4035] text-[0.86rem] font-bold">Komentar</span>
                <textarea
                    rows="4"
                    value={comment}
                    minLength={10}
                    placeholder="Ceritakan rasa, aroma, packaging, atau pengalaman seduh kopi ini."
                    onChange={(event) => setComment(event.target.value)}
                    required
                    className="w-full border border-[#d8cbbc] rounded-lg px-3 py-2.5 bg-[#fffdf9] color-[#261c15] focus:outline-none focus:ring-2 focus:ring-[#5b3825] focus:border-transparent transition-all"
                />
            </label>
            <label className="grid gap-1.5">
                <span className="block mb-1.5 text-[#4d4035] text-[0.86rem] font-bold">Gambar review (opsional)</span>
                <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => setImages(Array.from(event.target.files || []).slice(0, 5))}
                    className="w-full border border-[#d8cbbc] rounded-lg px-3 py-2 bg-[#fffdf9] color-[#261c15] focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#eaf4ef] file:text-[#2f6d56] hover:file:bg-[#d8eadb]"
                />
            </label>
            <button className="btn primary w-full md:w-auto" type="submit" disabled={submitting || !orderId}>
                {submitting ? 'Mengirim...' : 'Submit Review'}
            </button>
        </form>
    );
}
