import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../../components/public/EmptyState.jsx';
import ProductCard from '../../components/product/ProductCard.jsx';
import { apiRequest } from '../../services/api.js';
import { rowsFrom } from '../../utils/format.js';

const CATEGORY_VISUALS = {
    arabica: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=900&q=80',
    robusta: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=80',
    espresso: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=80',
    blend: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80',
    'manual-brew': 'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=900&q=80',
    'drip-bag': 'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?auto=format&fit=crop&w=900&q=80',
};

const FALLBACK_CATEGORIES = [
    { name: 'Arabica', slug: 'arabica', description: 'Single origin with clean acidity.' },
    { name: 'Robusta', slug: 'robusta', description: 'Bold body and deep crema.' },
    { name: 'Espresso', slug: 'espresso', description: 'Roasts built for milk and crema.' },
    { name: 'Manual Brew', slug: 'manual-brew', description: 'Bright cups for slow brewing.' },
];

export default function CatalogPage({ navigate, setNotice }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const featured = useMemo(() => {
        return [...products]
            .sort((a, b) => Number(b.avg_rating || 0) - Number(a.avg_rating || 0) || Number(b.reviews_count || 0) - Number(a.reviews_count || 0))
            .slice(0, 4);
    }, [products]);

    const categoryCards = (categories.length ? categories : FALLBACK_CATEGORIES).slice(0, 6);
    const sellers = useMemo(() => featuredSellers(products), [products]);

    function openCategory(category) {
        if (category.slug) sessionStorage.setItem('explore_category', category.slug);
        navigate('blog');
    }

    return (
        <section className="home-page">
            <HomeHero navigate={navigate} product={featured[0] || products[0]} />

            <section className="market-section">
                <div className="section-head">
                    <div>
                        <p className="eyebrow">How It Works</p>
                        <h2>From discovery to checkout in three focused steps</h2>
                    </div>
                </div>
                <div className="how-grid">
                    {[
                        ['01', 'Explore coffee', 'Browse curated beans by origin, roast, seller, and brewing style.'],
                        ['02', 'Choose variants', 'Pick weight, grind size, stock-ready options, and checkout with a clear order summary.'],
                        ['03', 'Share recommendations', 'Turn product picks into affiliate links and content that tracks clicks and commission.'],
                    ].map(([number, title, body]) => (
                        <article className="how-card" key={title}>
                            <span>{number}</span>
                            <h3>{title}</h3>
                            <p className="muted">{body}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="market-section">
                <div className="section-head">
                    <div>
                        <p className="eyebrow">Featured Products</p>
                        <h2>Selected coffee worth discovering</h2>
                    </div>
                    <button className="btn ghost" type="button" onClick={() => navigate('blog')}>
                        Explore all
                    </button>
                </div>
                {loading ? (
                    <ProductSkeleton />
                ) : featured.length > 0 ? (
                    <div className="featured-product-grid">
                        {featured.map((product) => <ProductCard key={product.id} product={product} navigate={navigate} />)}
                    </div>
                ) : (
                    <EmptyState
                        eyebrow="Produk"
                        title="Belum ada produk aktif."
                        message="Produk dari seller aktif akan tampil di sini."
                    />
                )}
            </section>

            <section className="market-section">
                <div className="section-head">
                    <div>
                        <p className="eyebrow">Popular Categories</p>
                        <h2>Browse by coffee style</h2>
                    </div>
                </div>
                <div className="category-card-grid">
                    {categoryCards.map((category) => (
                        <button
                            className="category-visual-card"
                            key={category.slug || category.name}
                            type="button"
                            style={{ backgroundImage: categoryBackground(category) }}
                            onClick={() => openCategory(category)}
                        >
                            <span>{category.name}</span>
                            <small>{category.description || 'Curated beans and brewing profiles.'}</small>
                        </button>
                    ))}
                </div>
            </section>

            <section className="market-section">
                <div className="section-head">
                    <div>
                        <p className="eyebrow">Featured Sellers</p>
                        <h2>Trusted local roasters</h2>
                    </div>
                </div>
                <div className="seller-card-grid">
                    {sellers.map((seller) => (
                        <article className="seller-feature-card" key={seller.id || seller.store_name}>
                            <span className="seller-feature-avatar">{initials(seller.store_name)}</span>
                            <div>
                                <h3>{seller.store_name}</h3>
                                <p className="muted">{seller.description || 'Curated coffee products from an active marketplace seller.'}</p>
                            </div>
                            <div className="seller-feature-meta">
                                <span>{seller.products} products</span>
                                <span>{seller.categories} categories</span>
                            </div>
                        </article>
                    ))}
                    {!loading && sellers.length === 0 && (
                        <EmptyState eyebrow="Seller" title="Belum ada seller aktif." message="Seller terverifikasi akan tampil di bagian ini." />
                    )}
                </div>
            </section>

            <section className="affiliate-home-band">
                <div>
                    <p className="eyebrow">Affiliate Content</p>
                    <h2>Editorial recommendations built into the marketplace.</h2>
                    <p>Creator dan customer bisa membaca postingan affiliate publik, membagikan produk, dan melacak komisi dari dashboard affiliate.</p>
                </div>
                <div className="affiliate-home-actions">
                    <button className="btn primary" type="button" onClick={() => navigate('affiliate-content')}>
                        View content
                    </button>
                    <button className="btn ghost" type="button" onClick={() => navigate('affiliate-dashboard')}>
                        Join affiliate
                    </button>
                </div>
            </section>
        </section>
    );
}

function HomeHero({ navigate, product }) {
    return (
        <section className="home-hero">
            <img
                className="home-hero-image"
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1800&q=85"
                alt="Coffee being prepared by a local roaster"
            />
            <div className="home-hero-shade" />
            <div className="home-hero-copy">
                <p className="eyebrow">Specialty coffee marketplace</p>
                <h1>Specialty Coffee, Curated for Modern Shopping</h1>
                <p>Belanja beans dari roaster lokal, pilih varian dengan jelas, dan temukan rekomendasi affiliate dalam satu marketplace yang clean.</p>
                <div className="home-hero-actions">
                    <button className="btn primary" type="button" onClick={() => navigate('blog')}>
                        Explore Coffee
                    </button>
                    <button className="btn ghost" type="button" onClick={() => navigate('affiliate-dashboard')}>
                        Join Affiliate
                    </button>
                </div>
                <div className="home-hero-stats" aria-label="Platform highlights">
                    <span>Local roasters</span>
                    <span>Verified sellers</span>
                    <span>Affiliate ready</span>
                </div>
            </div>
            {product && (
                <button className="home-hero-product" type="button" onClick={() => navigate('product', product.slug || product.id)}>
                    <span>Featured today</span>
                    <strong>{product.name}</strong>
                    <small>{product.seller?.store_name || 'Verified seller'}</small>
                </button>
            )}
        </section>
    );
}

function ProductSkeleton() {
    return (
        <div className="product-grid marketplace-product-grid">
            {Array.from({ length: 4 }).map((_, index) => (
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

function categoryBackground(category) {
    const image = CATEGORY_VISUALS[category.slug] || CATEGORY_VISUALS[category.name?.toLowerCase()] || CATEGORY_VISUALS.arabica;

    return `linear-gradient(180deg, rgba(22, 19, 17, 0.18), rgba(22, 19, 17, 0.76)), url(${image})`;
}

function featuredSellers(products) {
    const sellers = new Map();

    products.forEach((product) => {
        const seller = product.seller;
        if (!seller?.store_name) return;

        const current = sellers.get(seller.id || seller.store_name) || {
            ...seller,
            products: 0,
            categorySet: new Set(),
        };

        current.products += 1;
        if (product.category?.name) current.categorySet.add(product.category.name);
        sellers.set(seller.id || seller.store_name, current);
    });

    return [...sellers.values()].slice(0, 3).map((seller) => ({
        ...seller,
        categories: seller.categorySet.size || 1,
    }));
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
