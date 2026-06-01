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
    const [selectedImage, setSelectedImage] = useState('');
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        setProduct(null);
        setEligibility(null);
        setShowReviewForm(false);
        apiRequest(`/products/${productId}`)
            .then((data) => {
                setProduct(data.data);
                setSelectedImage(firstProductImage(data.data));
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

    async function addToCart({ checkout = false } = {}) {
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

            if (quantity > Number(variant.stock)) {
                setNotice('Quantity melebihi stock variant produk.');
                return;
            }

            await apiRequest('/cart/items', {
                method: 'POST',
                token,
                body: { product_id: product.id, product_variant_id: variant.id, quantity },
            });
            await refreshCartCount?.();
            if (checkout) {
                navigate('checkout');
                return;
            }
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
    const gallery = galleryImages(product);
    const currentStock = Number(currentVariant?.stock ?? product.stock ?? 0);
    const canPurchase = Boolean(currentVariant && currentStock > 0);

    return (
        <div className="product-detail-page">
            <section className="pdp-grid">
                <ProductGallery product={product} images={gallery} selectedImage={selectedImage} setSelectedImage={setSelectedImage} />

                <div className="pdp-information">
                    <header className="pdp-heading">
                        <span className="tag">{product.category?.name || 'Coffee'}</span>
                        <h1>{product.name}</h1>
                        <div className="pdp-price-row">
                            <strong className="product-detail-price">{formatPrice(currentVariant?.price ?? product.price)}</strong>
                            <span className={`pdp-stock-chip ${currentStock > 0 ? 'available' : 'empty'}`}>
                                {currentStock > 0 ? `Stock ${currentStock}` : 'Stock habis'}
                            </span>
                        </div>
                        <div className="rating-line">
                            {reviewsCount > 0 ? (
                                <>
                                    <StarRating value={averageRating} />
                                    <strong>{Number(averageRating).toLocaleString('id-ID', { maximumFractionDigits: 1 })}</strong>
                                    <span className="muted">{reviewsCount} ulasan</span>
                                </>
                            ) : (
                                <span className="muted">Belum ada rating</span>
                            )}
                        </div>
                    </header>

                    <section className="pdp-content-card">
                        <h2>Detail produk</h2>
                        <dl className="pdp-spec-list">
                            <div><dt>Asal kopi</dt><dd>{product.origin || '-'}</dd></div>
                            <div><dt>Roast level</dt><dd>{optionLabel(ROAST_LEVEL_OPTIONS, product.roast_level) || '-'}</dd></div>
                            <div><dt>Varian berat</dt><dd>{weightOptions.map(formatWeight).join(', ') || '-'}</dd></div>
                            <div><dt>Brewing method</dt><dd><BrewingMethods methods={product.brewing_methods} /></dd></div>
                        </dl>
                    </section>

                    <section className="pdp-content-card">
                        <h2>Deskripsi produk</h2>
                        <p className="pdp-description">{product.description || 'Seller belum menambahkan deskripsi produk.'}</p>
                    </section>

                    <section className="pdp-seller-card">
                        <span className="pdp-seller-avatar">{initials(product.seller?.store_name)}</span>
                        <div>
                            <small>Produk dari seller</small>
                            <strong>{product.seller?.store_name || 'Seller kopi'}</strong>
                            <p>Temukan pilihan kopi dan informasi produk langsung dari seller marketplace.</p>
                        </div>
                        <span className="badge verified">Seller aktif</span>
                    </section>
                </div>

                <aside className="pdp-purchase-card">
                    <div>
                        <p className="eyebrow">Atur pesanan</p>
                        <h2>Pilih varian produk</h2>
                    </div>
                    {variants.length > 0 ? (
                        <div className="pdp-variant-picker">
                            <VariantGroup label="Berat">
                                {weightOptions.map((weight) => (
                                    <button
                                        type="button"
                                        className={`pill-button ${selectedWeight === String(weight) ? 'selected' : ''}`}
                                        key={weight}
                                        onClick={() => {
                                            const nextVariant = preferredVariant(variants.filter((variant) => variant.weight_grams === weight));
                                            setSelectedWeight(String(weight));
                                            setSelectedGrind(nextVariant?.grind_size || '');
                                            setQuantity(1);
                                        }}
                                    >
                                        {formatWeight(weight)}
                                    </button>
                                ))}
                            </VariantGroup>
                            <VariantGroup label="Gilingan">
                                {grindOptions.map((variant) => (
                                    <button
                                        type="button"
                                        className={`pill-button ${selectedGrind === variant.grind_size ? 'selected' : ''}`}
                                        key={variant.id}
                                        disabled={variant.stock <= 0}
                                        onClick={() => {
                                            setSelectedGrind(variant.grind_size);
                                            setQuantity(1);
                                        }}
                                    >
                                        {variant.grind_size}
                                    </button>
                                ))}
                            </VariantGroup>
                        </div>
                    ) : (
                        <p className="muted">Varian produk belum tersedia.</p>
                    )}

                    <div className="pdp-quantity-row">
                        <span>Jumlah</span>
                        <div className="pdp-quantity-control">
                            <button type="button" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>-</button>
                            <strong>{quantity}</strong>
                            <button type="button" disabled={!canPurchase || quantity >= currentStock} onClick={() => setQuantity((value) => Math.min(currentStock, value + 1))}>+</button>
                        </div>
                    </div>

                    <div className="pdp-order-total">
                        <span>Subtotal</span>
                        <strong>{formatPrice(Number(currentVariant?.price ?? product.price ?? 0) * quantity)}</strong>
                    </div>

                    <div className="pdp-action-stack">
                        <button className="btn primary wide" type="button" disabled={!canPurchase} onClick={() => addToCart()}>
                            Tambah ke Cart
                        </button>
                        <button className="btn ghost wide" type="button" disabled={!canPurchase} onClick={() => addToCart({ checkout: true })}>
                            Beli Sekarang
                        </button>
                        {roleName(user) === 'customer' && (
                            <button className="pdp-affiliate-button" type="button" onClick={copyAffiliateLink}>
                                Salin link affiliate
                            </button>
                        )}
                    </div>
                    <p className="pdp-purchase-note">Pastikan berat dan tipe gilingan sudah sesuai sebelum checkout.</p>
                </aside>
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

function VariantGroup({ label, children }) {
    return (
        <div className="pdp-variant-group">
            <span>{label}</span>
            <div className="option-pills">{children}</div>
        </div>
    );
}

function BrewingMethods({ methods = [] }) {
    if (!methods.length) return '-';

    return (
        <span className="tag-row">
            {methods.map((method) => <span className="badge" key={method.id}>{method.name}</span>)}
        </span>
    );
}

function ProductGallery({ product, images, selectedImage, setSelectedImage }) {
    const currentImage = selectedImage || images[0]?.url || product.image_url || product.image;

    return (
        <div className="product-gallery">
            {currentImage ? (
                <img className="product-image large" src={currentImage} alt={product.name} />
            ) : (
                <ProductImage product={product} large />
            )}
            {images.length > 1 && (
                <div className="product-gallery-thumbs">
                    {images.map((image) => (
                        <button
                            className={currentImage === image.url ? 'active' : ''}
                            key={image.url}
                            type="button"
                            onClick={() => setSelectedImage(image.url)}
                            aria-label={`Lihat gambar ${image.label}`}
                        >
                            <img src={image.url} alt={image.label} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function initials(value = 'Seller Kopi') {
    return value
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
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

function galleryImages(product) {
    const images = [];

    if (product.image_url || product.image) {
        images.push({ url: product.image_url || product.image, label: product.name });
    }

    (product.images || []).forEach((image, index) => {
        const url = image.url || image.path;
        if (url && !images.some((item) => item.url === url)) {
            images.push({ url, label: `${product.name} ${index + 1}` });
        }
    });

    return images;
}

function firstProductImage(product) {
    return galleryImages(product)[0]?.url || '';
}
