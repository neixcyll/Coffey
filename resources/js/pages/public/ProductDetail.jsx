import { useEffect, useState } from 'react';
import { ROAST_LEVEL_OPTIONS } from '../../constants/options.js';
import ProductImage from '../../components/product/ProductImage.jsx';
import ReviewForm from '../../components/review/ReviewForm.jsx';
import StarRating from '../../components/review/StarRating.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, formatWeight, optionLabel } from '../../utils/format.js';
import { roleName } from '../../utils/route.js';

export default function ProductDetail({ productId, token, user, navigate, setNotice, refreshCartCount }) {
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewMeta, setReviewMeta] = useState({ avg_rating: null, reviews_count: 0 });
    const [eligibility, setEligibility] = useState(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [selectedWeight, setSelectedWeight] = useState('');
    const [selectedGrind, setSelectedGrind] = useState('');

    useEffect(() => {
        setProduct(null);
        setEligibility(null);
        setShowReviewForm(false);
        apiRequest(`/products/${productId}`)
            .then((data) => {
                setProduct(data.data);
                const firstVariant = preferredVariant(data.data?.variants || []);
                setSelectedWeight(firstVariant ? String(firstVariant.weight_grams) : '');
                setSelectedGrind(firstVariant?.grind_size || '');
            })
            .catch((error) => setNotice(error.message));
        loadReviews();
    }, [productId, setNotice]);

    useEffect(() => {
        if (!token || roleName(user) !== 'customer') {
            setEligibility(null);
            return;
        }

        apiRequest(`/products/${productId}/review-eligibility`, { token })
            .then((response) => setEligibility(response.data))
            .catch(() => setEligibility(null));
    }, [productId, token, user?.role?.name]);

    async function loadReviews() {
        const response = await apiRequest(`/products/${productId}/reviews`).catch((error) => {
            setNotice(error.message);
            return { data: [], meta: { avg_rating: null, reviews_count: 0 } };
        });
        setReviews(response.data || []);
        setReviewMeta(response.meta || { avg_rating: null, reviews_count: 0 });
    }

    async function addToCart() {
        if (!token || roleName(user) !== 'customer') {
            setNotice('Login sebagai customer untuk belanja.');
            navigate('login');
            return;
        }

        try {
            const variant = selectedVariant(product?.variants || [], selectedWeight, selectedGrind);

            if (!variant) {
                setNotice('Pilih variant berat dan gilingan terlebih dahulu.');
                return;
            }

            await apiRequest('/cart/items', {
                method: 'POST',
                token,
                body: { product_id: product.id, product_variant_id: variant.id, quantity: 1 },
            });
            await refreshCartCount?.();
            setNotice('Produk berhasil ditambahkan ke cart. Cek ikon cart di kanan atas.');
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function copyAffiliateLink() {
        if (!token || roleName(user) !== 'customer') {
            setNotice('Login sebagai customer untuk membuat link affiliate.');
            navigate('login');
            return;
        }

        try {
            const response = await apiRequest('/affiliate/dashboard', { token });
            if (response.data.requires_registration) {
                setNotice('Daftar affiliate terlebih dahulu.');
                navigate('affiliate-dashboard');
                return;
            }
            const code = response.data.profile.code;
            await navigator.clipboard?.writeText(`${window.location.origin}/product/${product.slug || product.id}?ref=${code}`);
            setNotice('Link affiliate produk disalin.');
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function afterReviewSubmitted() {
        await loadReviews();
        const response = await apiRequest(`/products/${productId}/review-eligibility`, { token }).catch(() => null);
        setEligibility(response?.data || null);
        setShowReviewForm(false);
    }

    if (!product) return <p className="muted">Memuat detail...</p>;

    const averageRating = reviewMeta.avg_rating ?? product.avg_rating;
    const reviewsCount = Number(reviewMeta.reviews_count ?? product.reviews_count ?? 0);
    const eligibleOrders = eligibility?.eligible_orders || [];
    const variants = product.variants || [];
    const weightOptions = uniqueWeights(variants);
    const grindOptions = variants.filter((variant) => String(variant.weight_grams) === selectedWeight);
    const currentVariant = selectedVariant(variants, selectedWeight, selectedGrind);

    return (
        <div className="product-detail-page">
            <section className="detail-layout">
                <ProductImage product={product} large />
                <div className="panel detail-copy">
                    <span className="tag">{product.category?.name}</span>
                    <h1>{product.name}</h1>
                    <div className="rating-line">
                        {reviewsCount > 0 ? (
                            <>
                                <StarRating value={averageRating} />
                                <strong>{Number(averageRating).toLocaleString('id-ID', { maximumFractionDigits: 1 })}</strong>
                                <span className="muted">({reviewsCount} review)</span>
                            </>
                        ) : (
                            <span className="muted">Belum ada rating</span>
                        )}
                    </div>
                    <p>{product.description}</p>
                    {variants.length > 0 && (
                        <div className="variant-picker">
                            <div>
                                <span>Berat</span>
                                <div className="option-pills">
                                    {weightOptions.map((weight) => (
                                        <button
                                            type="button"
                                            className={`pill-button ${selectedWeight === String(weight) ? 'selected' : ''}`}
                                            key={weight}
                                            onClick={() => {
                                                const nextVariant = preferredVariant(variants.filter((variant) => variant.weight_grams === weight));
                                                setSelectedWeight(String(weight));
                                                setSelectedGrind(nextVariant?.grind_size || '');
                                            }}
                                        >
                                            {formatWeight(weight)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span>Gilingan</span>
                                <div className="option-pills">
                                    {grindOptions.map((variant) => (
                                        <button
                                            type="button"
                                            className={`pill-button ${selectedGrind === variant.grind_size ? 'selected' : ''}`}
                                            key={variant.id}
                                            disabled={variant.stock <= 0}
                                            onClick={() => setSelectedGrind(variant.grind_size)}
                                        >
                                            {variant.grind_size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    <dl className="specs">
                        <div><dt>Harga</dt><dd>{formatPrice(currentVariant?.price ?? product.price)}</dd></div>
                        <div><dt>Stock</dt><dd>{currentVariant?.stock ?? product.stock}</dd></div>
                        <div><dt>Origin</dt><dd>{product.origin}</dd></div>
                        <div><dt>Roast</dt><dd>{optionLabel(ROAST_LEVEL_OPTIONS, product.roast_level)}</dd></div>
                        <div><dt>Brewing</dt><dd><span className="tag-row">{(product.brewing_methods || []).map((method) => <span className="badge" key={method.id}>{method.name}</span>)}</span></dd></div>
                        <div><dt>Seller</dt><dd>{product.seller?.store_name}</dd></div>
                    </dl>
                    <div className="row">
                        <button className="btn primary" disabled={!currentVariant || currentVariant.stock <= 0} onClick={addToCart}>Tambah ke Cart</button>
                        {roleName(user) === 'customer' && <button className="btn ghost" onClick={copyAffiliateLink}>Copy affiliate link</button>}
                    </div>
                </div>
            </section>

            <section className="review-section">
                <div className="section-head">
                    <div>
                        <p className="eyebrow">Review customer</p>
                        <h2>Ulasan Produk</h2>
                    </div>
                    <div className="rating-summary">
                        {reviewsCount > 0 ? (
                            <>
                                <strong>{Number(averageRating).toLocaleString('id-ID', { maximumFractionDigits: 1 })}</strong>
                                <StarRating value={averageRating} />
                                <span>{reviewsCount} review</span>
                            </>
                        ) : (
                            <span>Belum ada rating</span>
                        )}
                    </div>
                </div>

                {roleName(user) === 'customer' && eligibleOrders.length > 0 && (
                    <div className="panel review-write-panel">
                        <div className="row between">
                            <div>
                                <strong>Tulis review pembelianmu</strong>
                                <p className="muted">Review hanya tersedia untuk order completed yang belum pernah direview.</p>
                            </div>
                            <button className="btn ghost" onClick={() => setShowReviewForm((current) => !current)}>
                                {showReviewForm ? 'Tutup Form' : 'Tulis Review'}
                            </button>
                        </div>
                        {showReviewForm && (
                            <ReviewForm
                                product={product}
                                token={token}
                                eligibleOrders={eligibleOrders}
                                setNotice={setNotice}
                                onSubmitted={afterReviewSubmitted}
                            />
                        )}
                    </div>
                )}

                <div className="review-list">
                    {reviews.map((review) => (
                        <article className="review-card" key={review.id}>
                            <div className="review-card-head">
                                <div>
                                    <strong>{review.user?.name || 'Customer'}</strong>
                                    <div className="review-meta">
                                        <StarRating value={review.rating} />
                                        <span>{new Date(review.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                                <span className="badge verified">Verified Purchase</span>
                            </div>
                            <p>{review.comment}</p>
                            {(review.image_urls || []).length > 0 && (
                                <div className="review-images">
                                    {review.image_urls.map((url) => <img key={url} src={url} alt="Gambar review" />)}
                                </div>
                            )}
                            {review.seller_reply && (
                                <div className="seller-reply">
                                    <span className="badge">Balasan Seller</span>
                                    <p>{review.seller_reply}</p>
                                    {review.seller_replied_at && <small>{new Date(review.seller_replied_at).toLocaleString('id-ID')}</small>}
                                </div>
                            )}
                        </article>
                    ))}
                    {reviews.length === 0 && <div className="panel empty-state">Belum ada review untuk produk ini.</div>}
                </div>
            </section>
        </div>
    );
}

function preferredVariant(variants) {
    return variants.find((variant) => Number(variant.stock) > 0) || variants[0] || null;
}

function selectedVariant(variants, weight, grindSize) {
    return variants.find((variant) => String(variant.weight_grams) === String(weight) && variant.grind_size === grindSize) || null;
}

function uniqueWeights(variants) {
    return [...new Set(variants.map((variant) => Number(variant.weight_grams)).filter(Boolean))]
        .sort((a, b) => a - b);
}
