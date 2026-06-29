import { useEffect, useMemo, useRef, useState } from 'react';
import EmptyState from '../../components/public/EmptyState.jsx';
import ProductCard from '../../components/product/ProductCard.jsx';
import { ROAST_LEVEL_OPTIONS } from '../../constants/options.js';
import { applyFallbackImage, fallbackArticleImage, fallbackRoasterImage } from '../../constants/images.js';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';

const SHOP_VISUALS = {
    roast: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=85',
    origin: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=85',
    brew: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=900&q=85',
};

export default function CatalogPage({ navigate, setNotice }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sellersLoading, setSellersLoading] = useState(true);
    const [articlesLoading, setArticlesLoading] = useState(true);

    useEffect(() => {
        apiRequest('/categories')
            .then((data) => setCategories(data.data || []))
            .catch((error) => setNotice(error.message));
    }, [setNotice]);

    useEffect(() => {
        setLoading(true);
        apiRequest('/products?per_page=24')
            .then((data) => setProducts(rowsFrom(data)))
            .catch((error) => setNotice(error.message))
            .finally(() => setLoading(false));
    }, [setNotice]);

    useEffect(() => {
        setSellersLoading(true);
        apiRequest('/sellers?limit=12')
            .then((data) => setSellers(data.data || []))
            .catch((error) => setNotice(error.message))
            .finally(() => setSellersLoading(false));
    }, [setNotice]);

    useEffect(() => {
        setArticlesLoading(true);
        apiRequest('/articles?per_page=3&affiliate_only=1')
            .then((data) => setArticles(rowsFrom(data)))
            .catch((error) => setNotice(error.message))
            .finally(() => setArticlesLoading(false));
    }, [setNotice]);

    const featuredProducts = useMemo(() => {
        return [...products]
            .sort((a, b) => Number(b.avg_rating || 0) - Number(a.avg_rating || 0) || Number(b.reviews_count || 0) - Number(a.reviews_count || 0))
            .slice(0, 4);
    }, [products]);

    const heroProducts = featuredProducts.length ? featuredProducts : products.slice(0, 3);

    function openExplore(filter = {}) {
        if (filter.category) sessionStorage.setItem('explore_category', filter.category);
        if (filter.roast_level) sessionStorage.setItem('explore_roast_level', filter.roast_level);
        if (filter.origin) sessionStorage.setItem('explore_origin', filter.origin);
        navigate('blog');
    }

    return (
        <section className="home-page trade-home">
            <HomeHero products={heroProducts} navigate={navigate} />
            <QuickActionStrip navigate={navigate} />
            <MarketplaceDifference />
            <HowItWorks />
            <FeaturedCoffee loading={loading} products={featuredProducts} navigate={navigate} />
            <RoasterSpotlight loading={sellersLoading} sellers={sellers} navigate={navigate} />
            <MoreWaysToShop categories={categories} products={products} openExplore={openExplore} />
            <CommunityPicks loading={articlesLoading} articles={articles} navigate={navigate} />
            <Testimonials />
            <FinalCta navigate={navigate} />
        </section>
    );
}

function HomeHero({ products, navigate }) {
    const primaryProduct = products[0];

    return (
        <section className="trade-hero trade-commerce-hero">
            <div className="trade-commerce-panel fade-up-section">
                <div className="trade-commerce-bar">
                    <strong>Kopi Marketplace</strong>
                </div>
                <div className="trade-commerce-copy">
                    <p className="eyebrow">Specialty Coffee</p>
                    <h1>Find coffee that fits your taste.</h1>
                    <div className="trade-hero-actions">
                        <button className="btn primary" type="button" onClick={() => navigate('blog')}>
                            Shop Coffee
                        </button>
                        <button className="btn ghost" type="button" onClick={() => navigate('affiliate-content')}>
                            Stories
                        </button>
                    </div>
                </div>
                {primaryProduct && (
                    <button className="trade-commerce-feature" type="button" onClick={() => navigate('product', primaryProduct.slug || primaryProduct.id)}>
                        <span>
                            <small>Featured today</small>
                            <strong>{primaryProduct.name}</strong>
                            <small>{priceLabel(primaryProduct)}</small>
                        </span>
                        <ArrowIcon />
                    </button>
                )}
            </div>
        </section>
    );
}

function ArrowIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17 17 7" />
            <path d="M9 7h8v8" />
        </svg>
    );
}

function QuickActionStrip({ navigate }) {
    const items = [
        ['Coffee', ShopIcon, () => navigate('blog')],
        ['Roasters', StoreIcon, () => navigate('blog')],
        ['Stories', ContentIcon, () => navigate('affiliate-content')],
    ];

    return (
        <section className="trade-quick-strip" aria-label="Quick actions">
            {items.map(([title, Icon, onClick]) => (
                <button className="trade-quick-card fade-up-section" key={title} type="button" onClick={onClick}>
                    <span><Icon /></span>
                    <strong>{title}</strong>
                </button>
            ))}
        </section>
    );
}

function MarketplaceDifference() {
    const items = [
        ['Local roasters', StoreIcon],
        ['Curated coffee', BagIcon],
        ['Creator stories', ContentIcon],
    ];

    return (
        <section className="trade-section trade-difference">
            <div className="trade-section-heading centered fade-up-section">
                <p className="eyebrow">Marketplace</p>
                <h2>Coffee, roasters, stories.</h2>
            </div>
            <div className="trade-difference-grid">
                {items.map(([title, Icon]) => (
                    <article className="trade-difference-card fade-up-section" key={title}>
                        <span><Icon /></span>
                        <h3>{title}</h3>
                    </article>
                ))}
            </div>
        </section>
    );
}

function HowItWorks() {
    const steps = [
        ['01', 'Browse'],
        ['02', 'Choose'],
        ['03', 'Brew'],
    ];

    return (
        <section className="trade-section trade-how">
            <div className="trade-section-heading fade-up-section">
                <p className="eyebrow">Flow</p>
                <h2>Browse. Choose. Brew.</h2>
            </div>
            <div className="trade-how-grid">
                {steps.map(([number, title]) => (
                    <article className="trade-how-card fade-up-section" key={title}>
                        <span>{number}</span>
                        <h3>{title}</h3>
                    </article>
                ))}
            </div>
        </section>
    );
}

function FeaturedCoffee({ loading, products, navigate }) {
    return (
        <section className="trade-section trade-featured">
            <div className="trade-section-heading row-heading fade-up-section">
                <div>
                    <p className="eyebrow">Featured Coffee</p>
                    <h2>Fresh picks.</h2>
                </div>
                <button className="btn ghost" type="button" onClick={() => navigate('blog')}>
                    Explore all
                </button>
            </div>
            {loading ? (
                <ProductSkeleton count={4} />
            ) : products.length > 0 ? (
                <div className="trade-featured-grid">
                    {products.map((product) => <ProductCard key={product.id} product={product} navigate={navigate} />)}
                </div>
            ) : (
                <EmptyState eyebrow="Produk" title="Belum ada produk aktif." message="Produk dari seller aktif akan tampil di sini." />
            )}
        </section>
    );
}

function RoasterSpotlight({ loading, sellers, navigate }) {
    const trackRef = useRef(null);
    const drag = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
    const cards = loading ? Array.from({ length: 6 }).map((_, index) => ({ id: `skeleton-${index}`, skeleton: true })) : sellers;

    function beginDrag(event) {
        const track = trackRef.current;
        if (!track) return;

        drag.current = { active: true, moved: false, startX: event.clientX, scrollLeft: track.scrollLeft };
        track.classList.add('is-dragging');
        track.setPointerCapture?.(event.pointerId);
    }

    function moveDrag(event) {
        const track = trackRef.current;
        if (!track || !drag.current.active) return;

        const delta = event.clientX - drag.current.startX;
        if (Math.abs(delta) > 4) drag.current.moved = true;
        track.scrollLeft = drag.current.scrollLeft - delta;
    }

    function endDrag(event) {
        const track = trackRef.current;
        if (!track) return;

        drag.current.active = false;
        track.classList.remove('is-dragging');
        track.releasePointerCapture?.(event.pointerId);
    }

    function openSeller() {
        if (drag.current.moved) {
            drag.current.moved = false;
            return;
        }

        navigate('blog');
    }

    return (
        <section className="trade-section roaster-carousel-section" id="home-roasters" aria-labelledby="roaster-carousel-title">
            <div className="roaster-section-header fade-up-section">
                <div>
                    <p className="eyebrow">Roaster Spotlight</p>
                    <h2 id="roaster-carousel-title">Popular local roasters.</h2>
                    <p>Browse active sellers with ready-to-ship coffee.</p>
                </div>
                <button className="btn ghost roaster-view-all" type="button" onClick={() => navigate('blog')}>
                    Shop all sellers
                </button>
            </div>

            <div
                className="roaster-carousel-track"
                ref={trackRef}
                onPointerDown={beginDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onPointerLeave={(event) => drag.current.active && endDrag(event)}
            >
                {cards.length > 0 ? cards.map((seller, index) => (
                    <RoasterCard index={index} key={seller.id} seller={seller} onOpen={openSeller} />
                )) : (
                    <div className="roaster-empty-panel">
                        <p className="eyebrow">Roasters</p>
                        <h3>Belum ada seller aktif.</h3>
                        <p>Seller aktif akan tampil sebagai roaster spotlight di section ini.</p>
                    </div>
                )}
            </div>
        </section>
    );
}

function RoasterCard({ seller, index, onOpen }) {
    const themeClass = `theme-${(index % 10) + 1}`;

    if (seller.skeleton) {
        return (
            <article className={`roaster-card roaster-skeleton-card ${themeClass}`}>
                <div className="roaster-banner-placeholder" />
                <div className="roaster-card-body">
                    <span className="roaster-avatar-placeholder" />
                    <i />
                    <b />
                    <p />
                    <small />
                </div>
            </article>
        );
    }

    const name = seller.name || seller.store_name || 'Coffee Seller';
    const fallbackBanner = fallbackRoasterImage(seller, index);
    const banner = seller.banner || fallbackBanner;

    return (
        <button className={`roaster-card ${themeClass}`} type="button" onClick={onOpen}>
            <span className="roaster-banner-wrap">
                <img src={banner} alt={`${name} banner`} draggable="false" onError={(event) => applyFallbackImage(event, fallbackBanner)} />
            </span>
            <span className="roaster-card-body">
                <span className="roaster-avatar">
                    {seller.logo ? <img src={seller.logo} alt={`${name} logo`} draggable="false" /> : initials(name)}
                </span>
                <span className="roaster-count">{Number(seller.products_count || 0)} coffees curated</span>
                <strong>{name}</strong>
                <span className="roaster-description">
                    {seller.description || 'Specialty coffee seller focused on carefully selected beans and reliable fulfillment.'}
                </span>
            </span>
            <span className="roaster-card-bottom">
                <span className="roaster-location"><LocationIcon />{seller.city || 'Indonesia'}</span>
                <span className="roaster-badge">{seller.badge || badgeFor(index)}</span>
            </span>
        </button>
    );
}

function MoreWaysToShop({ categories, products, openExplore }) {
    const roast = ROAST_LEVEL_OPTIONS[1] || ROAST_LEVEL_OPTIONS[0];
    const originCategory = categories[0];
    const origin = products.find((product) => product.origin)?.origin;
    const cards = [
        ['Shop by Roast Level', 'Move from light and bright to bold espresso profiles.', SHOP_VISUALS.roast, () => openExplore({ roast_level: roast?.value })],
        ['Shop by Origin', 'Start with regional character, acidity, and body.', SHOP_VISUALS.origin, () => openExplore(origin ? { origin } : originCategory?.slug ? { category: originCategory.slug } : {})],
        ['Shop by Brewing Method', 'Find coffee that fits manual brew, espresso, or daily cups.', SHOP_VISUALS.brew, () => openExplore({})],
    ];

    return (
        <section className="trade-section">
            <div className="trade-section-heading fade-up-section">
                <p className="eyebrow">More Ways To Shop</p>
                <h2>Choose the path that matches the way you brew.</h2>
            </div>
            <div className="trade-shop-grid">
                {cards.map(([title, body, image, onClick]) => (
                    <button className="trade-shop-card fade-up-section" key={title} type="button" onClick={onClick}>
                        <img src={image} alt="" loading="lazy" />
                        <span>
                            <strong>{title}</strong>
                            <small>{body}</small>
                            <b>Explore</b>
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}

function CommunityPicks({ loading, articles, navigate }) {
    return (
        <section className="trade-section trade-community">
            <div className="trade-section-heading row-heading fade-up-section">
                <div>
                    <p className="eyebrow">Community Picks</p>
                    <h2>Explore coffee stories from our affiliate creators.</h2>
                </div>
                <button className="btn ghost" type="button" onClick={() => navigate('affiliate-content')}>
                    Explore Content
                </button>
            </div>

            {loading ? (
                <ArticleSkeleton />
            ) : articles.length > 0 ? (
                <div className="trade-community-grid">
                    {articles.map((article, index) => <ArticlePreview key={article.id} article={article} index={index} navigate={navigate} />)}
                </div>
            ) : (
                <EmptyState eyebrow="Content" title="Belum ada cerita affiliate." message="Postingan affiliate yang sudah publish akan tampil di sini." />
            )}
        </section>
    );
}

function ArticlePreview({ article, index, navigate }) {
    const fallback = fallbackArticleImage(article);
    const image = article.featured_image_url || article.featured_image || fallback;
    const author = article.author?.creator_profile?.display_name || article.author?.name || 'Coffee creator';
    const comments = Number(article.recommended_products_count || 0);

    return (
        <article className="trade-article-card fade-up-section">
            <button type="button" onClick={() => navigate('blog-detail', article.slug)}>
                <img src={image} alt={article.title} loading="lazy" onError={(event) => applyFallbackImage(event, fallbackArticleImage({ ...article, id: `${article.id}-${index}` }))} />
            </button>
            <div>
                <span>{article.category?.name || 'Affiliate story'}</span>
                <h3>{article.title}</h3>
                <p>{article.excerpt || 'Creator recommendations and coffee notes from the community.'}</p>
                <small>{author} · {Number(article.views_count || 0)} views · {comments} picks</small>
            </div>
        </article>
    );
}

function Testimonials() {
    const quotes = [
        ['Great way to discover coffee brands I never knew before.', 'Marketplace customer'],
        ['The seller context makes it easier to choose beans with confidence.', 'Home brewer'],
        ['Affiliate stories help product discovery feel more personal.', 'Coffee creator'],
    ];

    return (
        <section className="trade-section trade-testimonials">
            <div className="trade-section-heading centered fade-up-section">
                <p className="eyebrow">Marketplace Notes</p>
                <h2>Simple discovery, clear checkout.</h2>
            </div>
            <div className="trade-testimonial-grid">
                {quotes.map(([quote, person]) => (
                    <article className="trade-testimonial-card fade-up-section" key={quote}>
                        <p>"{quote}"</p>
                        <span>{person}</span>
                    </article>
                ))}
            </div>
        </section>
    );
}

function FinalCta({ navigate }) {
    return (
        <section className="trade-final-cta fade-up-section">
            <div>
                <p className="eyebrow">Start Here</p>
                <h2>Discover modern coffee from local roasters.</h2>
                <p>Search products, choose variants, and checkout with fewer distractions.</p>
            </div>
            <div>
                <button className="btn primary" type="button" onClick={() => navigate('blog')}>
                    Shop Coffee
                </button>
                <button className="btn ghost" type="button" onClick={() => navigate('affiliate-dashboard')}>
                    Become Affiliate
                </button>
            </div>
        </section>
    );
}

function ProductSkeleton({ count = 4 }) {
    return (
        <div className="trade-featured-grid">
            {Array.from({ length: count }).map((_, index) => (
                <div className="market-product-card skeleton-card" key={index}>
                    <div className="skeleton-image" />
                    <div className="product-body">
                        <span />
                        <strong />
                        <p />
                    </div>
                </div>
            ))}
        </div>
    );
}

function ArticleSkeleton() {
    return (
        <div className="trade-community-grid">
            {Array.from({ length: 3 }).map((_, index) => (
                <article className="trade-article-card skeleton-card" key={index}>
                    <span className="skeleton-image" />
                    <div>
                        <span />
                        <strong />
                        <p />
                    </div>
                </article>
            ))}
        </div>
    );
}

function priceLabel(product) {
    const min = Number(product.min_price ?? product.price ?? 0);
    const max = Number(product.max_price ?? product.price ?? min);

    return max > min ? `${formatPrice(min)} - ${formatPrice(max)}` : formatPrice(min);
}

function badgeFor(index) {
    return ['Specialty Coffee', 'Arabica Expert', 'Light Roast', 'Single Origin'][index % 4];
}

function initials(value) {
    return (value || 'Kopi')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function ShopIcon() {
    return <IconPath paths={['M3 9h18', 'm5 9 1-5h12l1 5', 'M5 9v11h14V9', 'M9 20v-6h6v6']} />;
}

function StoreIcon() {
    return <IconPath paths={['M4 10h16', 'm6 10 1-6h10l1 6', 'M6 10v10h12V10', 'M9 20v-6h6v6']} />;
}

function ContentIcon() {
    return <IconPath paths={['m12 3 9 5-9 5-9-5 9-5Z', 'm3 12 9 5 9-5', 'm3 16 9 5 9-5']} />;
}

function BagIcon() {
    return <IconPath paths={['M6 8h12l-1 12H7L6 8Z', 'M9 8a3 3 0 0 1 6 0']} />;
}

function LocationIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

function IconPath({ paths }) {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {paths.map((path) => <path d={path} key={path} />)}
        </svg>
    );
}
