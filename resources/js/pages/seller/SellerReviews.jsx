import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import StarRating from '../../components/review/StarRating.jsx';
import { apiRequest } from '../../services/api.js';

export default function SellerReviews({ token, navigate, setNotice }) {
    const [reviews, setReviews] = useState([]);
    const [replyDrafts, setReplyDrafts] = useState({});
    const [savingId, setSavingId] = useState(null);

    useEffect(() => {
        if (!token) return;
        loadReviews();
    }, [token]);

    async function loadReviews() {
        const response = await apiRequest('/seller/reviews', { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setReviews(response.data || []);
        setReplyDrafts(Object.fromEntries((response.data || []).map((review) => [review.id, review.seller_reply || ''])));
    }

    async function submitReply(review) {
        setSavingId(review.id);

        try {
            const response = await apiRequest(`/seller/reviews/${review.id}/reply`, {
                method: 'POST',
                token,
                body: { seller_reply: replyDrafts[review.id] || '' },
            });
            setReviews((current) => current.map((item) => (item.id === review.id ? response.data : item)));
            setNotice(response.message || 'Balasan seller berhasil disimpan.');
        } catch (error) {
            setNotice(error.message);
        } finally {
            setSavingId(null);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section>
            <div className="section-head">
                <div>
                    <p className="eyebrow">Ulasan produk</p>
                    <h1>Product Reviews</h1>
                </div>
            </div>

            <div className="stack">
                {reviews.map((review) => (
                    <article className="panel seller-review-card" key={review.id}>
                        <div className="row between">
                            <div>
                                <strong>{review.product?.name}</strong>
                                <p className="muted">
                                    {review.user?.name || 'Customer'} - {review.order?.order_number} - {new Date(review.created_at).toLocaleString('id-ID')}
                                </p>
                            </div>
                            <span className={`badge ${review.seller_reply ? 'verified' : ''}`}>
                                {review.seller_reply ? 'Sudah dibalas' : 'Belum dibalas'}
                            </span>
                        </div>

                        <div className="review-block">
                            <div className="review-meta">
                                <StarRating value={review.rating} />
                                <strong>{review.rating}/5</strong>
                            </div>
                            <p>{review.comment}</p>
                            {(review.image_urls || []).length > 0 && (
                                <div className="review-images">
                                    {review.image_urls.map((url) => <img key={url} src={url} alt="Gambar review" />)}
                                </div>
                            )}
                        </div>

                        {review.seller_reply && (
                            <div className="seller-reply">
                                <span className="badge">Balasan Seller</span>
                                <p>{review.seller_reply}</p>
                                {review.seller_replied_at && <small>{new Date(review.seller_replied_at).toLocaleString('id-ID')}</small>}
                            </div>
                        )}

                        <label>
                            <span>Balas Review</span>
                            <textarea
                                rows="3"
                                value={replyDrafts[review.id] || ''}
                                placeholder="Tulis balasan untuk customer."
                                onChange={(event) => setReplyDrafts((current) => ({ ...current, [review.id]: event.target.value }))}
                            />
                        </label>
                        <div className="row">
                            <button className="btn primary" onClick={() => submitReply(review)} disabled={savingId === review.id}>
                                {savingId === review.id ? 'Menyimpan...' : 'Save Balasan'}
                            </button>
                            <button className="btn ghost" onClick={() => navigate('product', review.product?.slug || review.product?.id)}>
                                Lihat Products
                            </button>
                        </div>
                    </article>
                ))}
                {reviews.length === 0 && <div className="panel empty-state">Belum ada review untuk produk seller ini.</div>}
            </div>
        </section>
    );
}
