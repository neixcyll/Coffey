import { useEffect, useState } from 'react';
import { ROAST_LEVEL_OPTIONS } from '../../constants/options.js';
import ProductCard from '../../components/product/ProductCard.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import ReviewForm from '../../components/review/ReviewForm.jsx';
import StarRating from '../../components/review/StarRating.jsx';
import { applyFallbackImage, fallbackProductImage } from '../../constants/images.js';
import { apiRequest } from '../../services/api.js';
import { formatPrice, formatWeight, optionLabel, rowsFrom } from '../../utils/format.js';
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
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [activeTab, setActiveTab] = useState('experience');

    useEffect(() => {
        setProduct(null);
        setEligibility(null);
        setShowReviewForm(false);
        setRelatedProducts([]);
        apiRequest(`/products/${productId}`)
            .then((data) => {
                setProduct(data.data);
                setSelectedImage(firstProductImage(data.data));
                const firstVariant = preferredVariant(data.data?.variants || []);
                setSelectedWeight(firstVariant ? String(firstVariant.weight_grams) : '');
                setSelectedGrind(firstVariant?.grind_size || '');
                loadRelatedProducts(data.data);
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

    async function loadRelatedProducts(currentProduct) {
        const category = currentProduct?.category?.slug;
        const query = new URLSearchParams({ per_page: '8' });

        if (category) query.set('category', category);

        const categoryResponse = await apiRequest(`/products?${query}`).catch(() => null);
        let nextProducts = rowsFrom(categoryResponse)
            .filter((item) => String(item.id) !== String(currentProduct?.id))
            .slice(0, 4);

        if (nextProducts.length < 4) {
            const fallbackResponse = await apiRequest('/products?per_page=8').catch(() => null);
            const fallbackProducts = rowsFrom(fallbackResponse)
                .filter((item) => String(item.id) !== String(currentProduct?.id))
                .filter((item) => !nextProducts.some((related) => String(related.id) === String(item.id)));
            nextProducts = [...nextProducts, ...fallbackProducts].slice(0, 4);
        }

        setRelatedProducts(nextProducts);
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
    const descriptionSections = productDescriptionSections(product);
    const highlights = productHighlights(product, currentStock, weightOptions);
    const coffeeInfo = coffeeInformation(product);
    const roastProfile = roastProfileDetails(product);
    const brewRecommendations = brewingRecommendations(product);
    const packageInfo = packageInformation(product, weightOptions, currentStock);
    const flavorNotes = flavorNoteList(product);

    return (
        <div className="pdp-premium">
            {/* ── S1: Image + Title + Short Description ── */}
            <section className="pdp-hero pdp-hero--stacked">
                <ProductGallery product={product} images={gallery} selectedImage={selectedImage} setSelectedImage={setSelectedImage} />

                <div className="pdp-identity">
                    <div className="pdp-breadcrumb">
                        <span>{product.category?.name || 'Coffee'}</span>
                        <span className="pdp-breadcrumb-sep">›</span>
                        <span>{product.origin || 'Indonesia'}</span>
                    </div>

                    <h1 className="pdp-product-name">{product.name}</h1>

                    <div className="pdp-rating-row">
                        {reviewsCount > 0 ? (
                            <>
                                <StarRating value={averageRating} />
                                <strong>{Number(averageRating).toLocaleString('id-ID', { maximumFractionDigits: 1 })}</strong>
                                <span className="pdp-rating-count">{reviewsCount} ulasan</span>
                            </>
                        ) : (
                            <span className="pdp-rating-count">Belum ada rating</span>
                        )}
                        <span className={`pdp-availability ${currentStock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                            {currentStock > 0 ? 'In Stock' : 'Sold Out'}
                        </span>
                    </div>

                    <p className="pdp-tagline">{premiumSummary(product)}</p>
                </div>

                {/* ── S2: Variants ── */}
                <div className="pdp-section-block">
                    {variants.length > 0 ? (
                        <div className="pdp-variant-selectors">
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
                </div>

                {/* ── S3: Quantity + Price ── */}
                <div className="pdp-section-block">
                    <div className="pdp-qty-price-row">
                        <div className="pdp-quantity-row">
                            <span>Jumlah</span>
                            <div className="pdp-quantity-control">
                                <button type="button" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
                                <strong>{quantity}</strong>
                                <button type="button" disabled={!canPurchase || quantity >= currentStock} onClick={() => setQuantity((value) => Math.min(currentStock, value + 1))}>+</button>
                            </div>
                        </div>
                        <div className="pdp-price-display">
                            <strong className="product-detail-price">{formatPrice(currentVariant?.price ?? product.price)}</strong>
                            {currentVariant && <span className="pdp-per-unit">/ {formatWeight(currentVariant.weight_grams)}</span>}
                        </div>
                    </div>
                    <div className="pdp-subtotal">
                        <span>Subtotal</span>
                        <strong>{formatPrice(Number(currentVariant?.price ?? product.price ?? 0) * quantity)}</strong>
                    </div>
                </div>

                {/* ── S4: Badges + Actions ── */}
                <div className="pdp-section-block">
                    <div className="pdp-quick-attrs">
                        {highlights.map(([label, value]) => (
                            <div className="pdp-attr" key={label}>
                                <span className="pdp-attr-label">{label}</span>
                                <span className="pdp-attr-value">{value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pdp-action-buttons">
                        <button className="btn primary wide" type="button" disabled={!canPurchase} onClick={() => addToCart()}>
                            Tambah ke Cart
                        </button>
                        <button className="btn ghost wide" type="button" disabled={!canPurchase} onClick={() => addToCart({ checkout: true })}>
                            Beli Sekarang
                        </button>
                    </div>
                    {roleName(user) === 'customer' && (
                        <button className="pdp-affiliate-link" type="button" onClick={copyAffiliateLink}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                            Salin link affiliate
                        </button>
                    )}
                    <p className="pdp-purchase-hint">Pastikan berat dan tipe gilingan sudah sesuai sebelum checkout.</p>
                </div>
            </section>

            {/* ── Flavor Profile Bar ── */}
            {flavorNotes.length > 0 && (
                <section className="pdp-flavor-bar">
                    <div className="pdp-flavor-bar-inner">
                        <h3>Flavor Profile</h3>
                        <div className="pdp-flavor-tags">
                            {flavorNotes.map((note) => (
                                <span className="pdp-flavor-tag" key={note}>{note}</span>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Storytelling: Tabbed Content ── */}
            <section className="pdp-story">
                <nav className="pdp-story-nav">
                    <button type="button" className={activeTab === 'experience' ? 'active' : ''} onClick={() => setActiveTab('experience')}>
                        The Experience
                    </button>
                    <button type="button" className={activeTab === 'specs' ? 'active' : ''} onClick={() => setActiveTab('specs')}>
                        Specifications
                    </button>
                    <button type="button" className={activeTab === 'brewing' ? 'active' : ''} onClick={() => setActiveTab('brewing')}>
                        Brewing Guide
                    </button>
                </nav>

                <div className="pdp-story-body">
                    {activeTab === 'experience' && (
                        <div className="pdp-experience fade-in">
                            {descriptionSections.map(([title, body]) => (
                                <article className="pdp-narrative-block" key={title}>
                                    <h3>{title}</h3>
                                    <p>{body}</p>
                                </article>
                            ))}
                        </div>
                    )}

                    {activeTab === 'specs' && (
                        <div className="pdp-specifications fade-in">
                            <SpecSection title="Coffee Information" rows={coffeeInfo} />
                            <SpecSection title="Roast Profile" rows={roastProfile} />
                            <SpecSection title="Package Information" rows={packageInfo} />
                        </div>
                    )}

                    {activeTab === 'brewing' && (
                        <div className="pdp-brewing-guide fade-in">
                            {brewRecommendations.map(([label, value]) => (
                                <div className="pdp-brew-item" key={label}>
                                    <h4>{label}</h4>
                                    <p>{value}</p>
                                </div>
                            ))}
                            <div className="pdp-brew-item">
                                <h4>Cup Style</h4>
                                <p>{cupStyle(product)}</p>
                            </div>
                            <div className="pdp-brew-item">
                                <h4>Ideal For</h4>
                                <p>{idealFor(product)}</p>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ── Roaster / Seller Profile ── */}
            <section className="pdp-roaster">
                <div className="pdp-roaster-inner">
                    <div className="pdp-roaster-identity">
                        <span className="pdp-roaster-avatar">{initials(product.seller?.store_name)}</span>
                        <div className="pdp-roaster-info">
                            <small>Roaster Partner</small>
                            <h3>{product.seller?.store_name || 'Seller kopi'}</h3>
                        </div>
                        <span className="badge verified">Verified</span>
                    </div>
                    <p className="pdp-roaster-bio">
                        Seller aktif dengan pilihan kopi yang siap dikirim dan dikurasi untuk pengalaman seduh harian.
                        Setiap produk dipilih dengan standar kualitas tinggi dan proses roasting yang konsisten.
                    </p>
                </div>
            </section>

            {/* ── Reviews ── */}
            <section className="pdp-reviews">
                <div className="pdp-reviews-header">
                    <div>
                        <p className="pdp-section-label">Customer Reviews</p>
                        <h2>Ulasan Produk</h2>
                    </div>
                    <div className="pdp-reviews-summary">
                        {reviewsCount > 0 ? (
                            <>
                                <strong className="pdp-reviews-score">{Number(averageRating).toLocaleString('id-ID', { maximumFractionDigits: 1 })}</strong>
                                <div>
                                    <StarRating value={averageRating} />
                                    <span className="pdp-reviews-count">{reviewsCount} review</span>
                                </div>
                            </>
                        ) : (
                            <span className="pdp-reviews-count">Belum ada rating</span>
                        )}
                    </div>
                </div>

                {roleName(user) === 'customer' && eligibleOrders.length > 0 && (
                    <div className="pdp-review-prompt">
                        <div className="pdp-review-prompt-content">
                            <div>
                                <strong>Tulis review pembelianmu</strong>
                                <p>Review hanya tersedia untuk order completed yang belum pernah direview.</p>
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

                <div className="pdp-review-list">
                    {reviews.map((review) => (
                        <article className="pdp-review-item" key={review.id}>
                            <div className="pdp-review-item-head">
                                <div>
                                    <strong>{review.user?.name || 'Customer'}</strong>
                                    <div className="pdp-review-item-meta">
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
                    {reviews.length === 0 && <div className="pdp-empty-reviews">Belum ada review untuk produk ini.</div>}
                </div>
            </section>

            {/* ── Related Products ── */}
            {relatedProducts.length > 0 && (
                <section className="pdp-related">
                    <div className="pdp-related-header">
                        <p className="pdp-section-label">You May Also Like</p>
                        <h2>More coffee from this category</h2>
                    </div>
                    <div className="featured-product-grid">
                        {relatedProducts.map((item) => <ProductCard key={item.id} product={item} navigate={navigate} />)}
                    </div>
                </section>
            )}
        </div>
    );
}

/* ── Sub-components ── */

function VariantGroup({ label, children }) {
    return (
        <div className="pdp-variant-group">
            <span>{label}</span>
            <div className="option-pills">{children}</div>
        </div>
    );
}

function SpecSection({ title, rows }) {
    return (
        <div className="pdp-spec-section">
            <h3>{title}</h3>
            <dl className="pdp-spec-pairs">
                {rows.map(([label, value]) => (
                    <div className="pdp-spec-pair" key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}

function FlavorPills({ notes }) {
    return (
        <div className="pdp-flavor-pills">
            {notes.map((note) => <span key={note}>{note}</span>)}
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
    const fallback = fallbackProductImage(product);
    const currentImage = selectedImage || images[0]?.url || product.image_url || product.image || fallback;

    return (
        <div className="product-gallery">
            {currentImage ? (
                <div className="product-gallery-main">
                    <img className="product-image large" src={currentImage} alt={product.name} onError={(event) => applyFallbackImage(event, fallback)} />
                </div>
            ) : (
                <div className="product-gallery-main">
                    <ProductImage product={product} large />
                </div>
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
                            <img src={image.url} alt={image.label} onError={(event) => applyFallbackImage(event, fallback)} />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ── Utility Functions ── */

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

function premiumSummary(product) {
    const category = product.category?.name || 'coffee';
    const origin = product.origin || 'Indonesia';
    const roast = optionLabel(ROAST_LEVEL_OPTIONS, product.roast_level) || 'balanced';

    return `${category} from ${origin} with a ${roast.toLowerCase()} roast profile, selected for a clean cup, layered sweetness, and an easy daily brewing experience.`;
}

function productDescriptionSections(product) {
    const origin = product.origin || 'Indonesia';
    const roast = optionLabel(ROAST_LEVEL_OPTIONS, product.roast_level) || 'balanced';
    const notes = flavorNoteList(product);
    const methods = methodNames(product);
    const brewText = methods.length ? methods.join(', ') : 'manual brew, espresso, or daily black coffee';
    const sellerDescription = cleanSentence(product.description);

    return [
        [
            'Product Overview',
            sellerDescription || `A carefully selected coffee from ${origin}, roasted to bring clarity, sweetness, and a rounded finish into every cup.`,
        ],
        [
            'Flavor Notes',
            `Expect a layered profile of ${notes.slice(0, 4).join(', ').toLowerCase()} with enough sweetness to feel polished without becoming heavy.`,
        ],
        [
            'Aroma',
            `The dry aroma opens with warm roasted coffee fragrance, soft sweetness, and a gentle hint of ${notes[0].toLowerCase()} before brewing.`,
        ],
        [
            'Body',
            bodyDescription(product.roast_level),
        ],
        [
            'Acidity',
            acidityDescription(product.roast_level),
        ],
        [
            'Brewing Recommendation',
            `Best enjoyed with ${brewText}. Use fresh water and adjust grind size gradually to keep the cup sweet, clean, and balanced.`,
        ],
        [
            'Ideal For',
            idealFor(product),
        ],
        [
            'Storage Recommendation',
            'Keep the coffee sealed in an airtight container, away from direct sunlight, heat, and humidity. Brew within a few weeks after opening for the clearest aroma.',
        ],
    ];
}

function productHighlights(product, stock, weights) {
    return [
        ['Origin', product.origin || 'Indonesia'],
        ['Roast', optionLabel(ROAST_LEVEL_OPTIONS, product.roast_level) || 'Balanced'],
        ['Stock', stock > 0 ? 'Ready to ship' : 'Sold out'],
        ['Sizes', weights.map(formatWeight).join(', ') || 'Ask seller'],
    ];
}

function coffeeInformation(product) {
    return [
        ['Origin', product.origin || '-'],
        ['Category', product.category?.name || 'Coffee'],
        ['Region', product.origin || 'Indonesia'],
        ['Processing Method', inferredProcessing(product)],
        ['Variety', product.category?.name || '-'],
    ];
}

function roastProfileDetails(product) {
    const roast = optionLabel(ROAST_LEVEL_OPTIONS, product.roast_level) || 'Balanced';

    return [
        ['Roast Level', roast],
        ['Body', shortBody(product.roast_level)],
        ['Sweetness', sweetnessLevel(product)],
        ['Acidity', shortAcidity(product.roast_level)],
        ['Bitterness', bitternessLevel(product.roast_level)],
    ];
}

function brewingRecommendations(product) {
    const methods = methodNames(product);

    return [
        ['Recommended Methods', methods.join(', ') || 'V60, French Press, Espresso'],
        ['Grind Direction', grindDirection(methods)],
        ['Cup Style', cupStyle(product)],
    ];
}

function packageInformation(product, weights, stock) {
    const sizes = weights.length ? weights.map(formatWeight).join(', ') : product.weight ? formatWeight(product.weight) : '-';

    return [
        ['Available Sizes', sizes],
        ['Shelf Life', 'Best consumed fresh after opening'],
        ['Availability', stock > 0 ? `${stock} packs available` : 'Currently unavailable'],
        ['Storage', 'Seal tightly and keep in a cool, dry place'],
    ];
}

function flavorNoteList(product) {
    const haystack = `${product.name || ''} ${product.description || ''} ${product.origin || ''}`.toLowerCase();
    const notes = [];

    [
        ['chocolate', ['cokelat', 'chocolate', 'espresso', 'blend']],
        ['caramel', ['caramel', 'sweet', 'manis', 'gayo']],
        ['citrus', ['citrus', 'acidity', 'washed']],
        ['floral', ['floral', 'flower', 'gayo']],
        ['berry', ['berry', 'wine', 'natural']],
        ['spice', ['rempah', 'spice', 'toraja']],
        ['roasted peanut', ['kacang', 'nut', 'robusta', 'temanggung']],
    ].forEach(([note, keywords]) => {
        if (keywords.some((keyword) => haystack.includes(keyword))) notes.push(note);
    });

    return [...new Set(notes.length ? notes : ['chocolate', 'caramel', 'citrus', 'brown sugar'])];
}

function methodNames(product) {
    return (product.brewing_methods || []).map((method) => method.name).filter(Boolean);
}

function cleanSentence(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function inferredProcessing(product) {
    const value = `${product.name || ''} ${product.description || ''}`.toLowerCase();

    if (value.includes('wine')) return 'Wine process';
    if (value.includes('washed')) return 'Washed';
    if (value.includes('natural')) return 'Natural';
    if (value.includes('blend')) return 'Blend';

    return 'Roaster selection';
}

function bodyDescription(roastLevel) {
    if (roastLevel === 'dark') return 'Full and weighty, with a dense mouthfeel that works well for milk drinks and bold black coffee.';
    if (roastLevel === 'medium-dark') return 'Round and satisfying, balancing syrupy texture with enough clarity for both espresso and filter brewing.';
    if (roastLevel === 'light') return 'Light to medium, clean on the palate, and designed to highlight aromatics over heaviness.';

    return 'Medium and smooth, giving the cup enough structure without covering its sweetness and aroma.';
}

function acidityDescription(roastLevel) {
    if (roastLevel === 'dark') return 'Low and soft, keeping the cup mellow with a long roasted finish.';
    if (roastLevel === 'medium-dark') return 'Medium-low and rounded, adding lift without sharpness.';
    if (roastLevel === 'light') return 'Bright and expressive, ideal for drinkers who enjoy a lively cup.';

    return 'Balanced and clean, bringing freshness while keeping the cup easy to enjoy.';
}

function idealFor(product) {
    const methods = methodNames(product);

    if (methods.some((method) => method.toLowerCase().includes('espresso'))) {
        return 'Home baristas who want a structured cup with dependable sweetness for espresso, milk drinks, and moka pot brewing.';
    }

    if (methods.some((method) => ['v60', 'aeropress', 'chemex'].includes(method.toLowerCase()))) {
        return 'Manual brew drinkers who enjoy a clean, aromatic cup with clear flavor separation.';
    }

    return 'Daily coffee drinkers who want a polished cup that is simple to brew and easy to enjoy.';
}

function shortBody(roastLevel) {
    if (roastLevel === 'dark') return 'Full';
    if (roastLevel === 'medium-dark') return 'Medium-full';
    if (roastLevel === 'light') return 'Light-medium';

    return 'Medium';
}

function shortAcidity(roastLevel) {
    if (roastLevel === 'dark') return 'Low';
    if (roastLevel === 'medium-dark') return 'Medium-low';
    if (roastLevel === 'light') return 'Bright';

    return 'Balanced';
}

function sweetnessLevel(product) {
    const value = `${product.name || ''} ${product.description || ''}`.toLowerCase();

    if (value.includes('robusta') || value.includes('dark')) return 'Medium';
    if (value.includes('wine') || value.includes('gayo') || value.includes('caramel')) return 'High';

    return 'Medium-high';
}

function bitternessLevel(roastLevel) {
    if (roastLevel === 'dark') return 'Medium-high';
    if (roastLevel === 'medium-dark') return 'Medium';
    if (roastLevel === 'light') return 'Low';

    return 'Medium-low';
}

function grindDirection(methods) {
    const normalized = methods.map((method) => method.toLowerCase());

    if (normalized.some((method) => method.includes('espresso') || method.includes('moka'))) return 'Fine to medium-fine';
    if (normalized.some((method) => method.includes('french'))) return 'Coarse';
    if (normalized.some((method) => method.includes('v60') || method.includes('aeropress'))) return 'Medium';

    return 'Adjust to your brewer';
}

function cupStyle(product) {
    if (product.roast_level === 'dark') return 'Bold, dense, and low-acidity';
    if (product.roast_level === 'light') return 'Bright, aromatic, and clean';
    if (product.roast_level === 'medium-dark') return 'Sweet, rounded, and espresso-friendly';

    return 'Balanced, sweet, and versatile';
}
