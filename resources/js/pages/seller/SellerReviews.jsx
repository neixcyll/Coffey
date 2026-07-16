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
        <section className="p-6 md:p-8 max-w-5xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase mb-1">Reviews Seller</p>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">Ulasan Pelanggan</h1>
                </div>
            </div>

            <div className="space-y-6">
                {reviews.map((review) => (
                    <article className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6 items-start" key={review.id}>
                        {/* Rating & Product Info */}
                        <div className="w-full md:w-1/4 flex-shrink-0">
                            <strong className="block text-gray-900 font-bold text-base mb-1 truncate" title={review.product?.name}>
                                {review.product?.name}
                            </strong>
                            <span className="block text-xs text-gray-500 mb-3">{review.user?.name || 'Customer'}</span>
                            
                            <div className="flex items-center gap-1.5 mb-3">
                                <StarRating value={review.rating} />
                                <span className="text-sm font-bold text-gray-900">{review.rating}/5</span>
                            </div>

                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                review.seller_reply ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                                {review.seller_reply ? 'Sudah dibalas' : 'Belum dibalas'}
                            </span>
                        </div>

                        {/* Comment & Replies */}
                        <div className="flex-1 w-full space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
                                {(review.image_urls || []).length > 0 && (
                                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                                        {review.image_urls.map((url) => (
                                            <img className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0" key={url} src={url} alt="Gambar review" />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {review.seller_reply && (
                                <div className="bg-gray-100/50 p-4 rounded-xl border border-gray-200/60 ml-4 relative">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Balasan Anda:</span>
                                    <p className="text-gray-800 text-sm leading-relaxed">{review.seller_reply}</p>
                                    {review.seller_replied_at && (
                                        <small className="block text-right text-[10px] text-gray-400 mt-2">
                                            {new Date(review.seller_replied_at).toLocaleDateString('id-ID')}
                                        </small>
                                    )}
                                </div>
                            )}

                            {/* Reply Input */}
                            <div className="space-y-3 pt-2">
                                <textarea
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none bg-white resize-none"
                                    rows="2"
                                    value={replyDrafts[review.id] || ''}
                                    placeholder="Tulis balasan untuk customer..."
                                    onChange={(event) => setReplyDrafts((current) => ({ ...current, [review.id]: event.target.value }))}
                                />
                                <div className="flex items-center gap-2">
                                    <button 
                                        className="px-4 py-2 text-xs font-semibold text-white bg-black hover:bg-gray-800 rounded-lg shadow-sm transition-colors" 
                                        onClick={() => submitReply(review)} 
                                        disabled={savingId === review.id}
                                    >
                                        {savingId === review.id ? 'Menyimpan...' : 'Kirim Balasan'}
                                    </button>
                                    <button 
                                        className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                        onClick={() => navigate('product', review.product?.slug || review.product?.id)}
                                    >
                                        Lihat Produk
                                    </button>
                                </div>
                            </div>
                        </div>
                    </article>
                ))}

                {reviews.length === 0 && (
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-16 text-center">
                        <div className="mx-auto w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.367 1.243.583 1.83l-3.978 2.89a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.978-2.89a1 1 0 00-1.176 0l-3.978 2.89c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.83.582-1.83h4.907a1 1 0 00.95-.69l1.519-4.674z"/></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Belum ada ulasan</h3>
                        <p className="text-gray-500 mt-1 max-w-xs mx-auto">Saat ini belum ada pembeli yang memberikan ulasan produk Anda.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
