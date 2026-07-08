import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../../components/public/EmptyState.jsx';
import ProductCard from '../../components/product/ProductCard.jsx';
import { ROAST_LEVEL_OPTIONS } from '../../constants/options.js';
import { apiRequest } from '../../services/api.js';
import { optionLabel, rowsFrom } from '../../utils/format.js';

const emptyFilters = { search: '', category: '', roast_level: '', origin: '' };

export default function ExplorePage({ navigate, setNotice }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);
    const [sort, setSort] = useState('recommended');
    const [filters, setFilters] = useState(() => {
        const search = sessionStorage.getItem('explore_search') || '';
        const category = sessionStorage.getItem('explore_category') || '';
        const roastLevel = sessionStorage.getItem('explore_roast_level') || '';
        const origin = sessionStorage.getItem('explore_origin') || '';
        sessionStorage.removeItem('explore_search');
        sessionStorage.removeItem('explore_category');
        sessionStorage.removeItem('explore_roast_level');
        sessionStorage.removeItem('explore_origin');
        return { ...emptyFilters, search, category, roast_level: roastLevel, origin };
    });

    useEffect(() => {
        apiRequest('/categories')
            .then((data) => setCategories(data.data || []))
            .catch((error) => setNotice(error.message));
    }, [setNotice]);

    useEffect(() => {
        const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
        query.set('per_page', '100');
        setLoading(true);
        apiRequest(`/products?${query}`)
            .then((data) => setProducts(rowsFrom(data)))
            .catch((error) => setNotice(error.message))
            .finally(() => setLoading(false));
    }, [filters, setNotice]);

    const sortedProducts = useMemo(() => sortProducts(products, sort), [products, sort]);
    const sections = useMemo(() => {
        const byRating = [...products].sort((a, b) => Number(b.avg_rating || 0) - Number(a.avg_rating || 0) || Number(b.reviews_count || 0) - Number(a.reviews_count || 0));
        const byReviews = [...products].sort((a, b) => Number(b.reviews_count || 0) - Number(a.reviews_count || 0));
        const byStock = [...products].sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0));

        return {
            recommended: byStock.slice(0, 4),
            trending: byReviews.slice(0, 4),
            newest: products.slice(0, 4),
            bestRated: byRating.slice(0, 4),
        };
    }, [products]);

    const chips = activeChips(categories, filters);
    const hasDiscoveryContext = chips.length > 0;

    function update(field, value) {
        setFilters((current) => ({ ...current, [field]: value }));
    }

    function resetFilters() {
        setFilters(emptyFilters);
    }

    return (
        <section className="explore-page">
            <header className="explore-page-header">
                <div>
                    <p className="eyebrow">Explore Coffee</p>
                    <h1>Find the right beans faster.</h1>
                </div>
                <div className="explore-search-row">
                    <input
                        className="explore-search-input"
                        placeholder="Search coffee, origin, seller..."
                        value={filters.search}
                        onChange={(event) => update('search', event.target.value)}
                    />
                    <button className="btn ghost filter-toggle-button" type="button" onClick={() => setFilterOpen(true)}>
                        <FilterIcon />
                        <span>Filter</span>
                    </button>
                    <div className="explore-sort-control">
                        <SortIcon />
                        <select value={sort} onChange={(event) => setSort(event.target.value)}>
                            <option value="recommended">Recommended</option>
                            <option value="newest">Newest</option>
                            <option value="rating">Top rated</option>
                            <option value="price-low">Price: Low → High</option>
                            <option value="price-high">Price: High → Low</option>
                        </select>
                    </div>
                </div>
                {chips.length > 0 && (
                    <div className="active-filter-row">
                        {chips.map((chip) => (
                            <button className="active-filter-chip" key={chip.key} type="button" onClick={() => update(chip.key, '')}>
                                {chip.label}
                                <span aria-hidden="true">x</span>
                            </button>
                        ))}
                        <button className="active-filter-chip clear" type="button" onClick={resetFilters}>
                            Clear all
                        </button>
                    </div>
                )}
            </header>

            {loading ? (
                <ProductSkeleton />
            ) : products.length === 0 ? (
                <EmptyState
                    eyebrow="Explore"
                    title="Tidak ada produk yang sesuai."
                    message="Gunakan keyword yang lebih luas atau hapus filter lanjutan."
                    actionLabel="Reset Filter"
                    onAction={resetFilters}
                />
            ) : hasDiscoveryContext ? (
                <section className="market-section">
                    <div className="section-head">
                        <div>
                            <p className="eyebrow">Results</p>
                            <h2>{sortedProducts.length} products found</h2>
                        </div>
                    </div>
                    <div className="product-grid marketplace-product-grid">
                        {sortedProducts.map((product) => <ProductCard key={product.id} product={product} navigate={navigate} />)}
                    </div>
                </section>
            ) : (
                <>
                    <ProductRail eyebrow="Trending Products" title="Popular picks from active buyers" products={sections.trending} navigate={navigate} />
                    <ProductRail eyebrow="New Arrivals" title="Fresh listings from local roasters" products={sections.newest} navigate={navigate} />
                    <ProductRail eyebrow="Best Rated" title="Highly reviewed coffee selections" products={sections.bestRated} navigate={navigate} />
                    <ProductRail eyebrow="Recommended" title="Good stock and ready to brew" products={sections.recommended} navigate={navigate} />
                </>
            )}

            <AdvancedFilterDrawer
                open={filterOpen}
                categories={categories}
                filters={filters}
                update={update}
                resetFilters={resetFilters}
                onClose={() => setFilterOpen(false)}
            />
        </section>
    );
}

function ProductRail({ eyebrow, title, products, navigate }) {
    if (!products.length) return null;

    return (
        <section className="market-section explore-rail">
            <div className="section-head">
                <div>
                    <p className="eyebrow">{eyebrow}</p>
                    <h2>{title}</h2>
                </div>
            </div>
            <div className="featured-product-grid">
                {products.map((product) => <ProductCard key={product.id} product={product} navigate={navigate} />)}
            </div>
        </section>
    );
}

function AdvancedFilterDrawer({ open, categories, filters, update, resetFilters, onClose }) {
    return (
        <div className={`filter-drawer-shell ${open ? 'open' : ''}`} aria-hidden={!open}>
            {open && <button className="filter-drawer-backdrop" type="button" aria-label="Tutup filter" onClick={onClose} />}
            <aside className="filter-drawer" aria-label="Advanced filters" aria-modal="true" role="dialog">
                <header className="cart-drawer-header">
                    <div>
                        <p className="eyebrow">Filter</p>
                        <h2>Refine discovery</h2>
                    </div>
                    <button className="icon-button" type="button" aria-label="Tutup filter" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </header>
                <div className="filter-drawer-fields">
                    <label>
                        <span>Category</span>
                        <select value={filters.category} onChange={(event) => update('category', event.target.value)}>
                            <option value="">All categories</option>
                            {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                        </select>
                    </label>
                    <label>
                        <span>Roast Level</span>
                        <select value={filters.roast_level} onChange={(event) => update('roast_level', event.target.value)}>
                            <option value="">Any roast</option>
                            {ROAST_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </label>
                    <label>
                        <span>Origin</span>
                        <input placeholder="Aceh, Toraja, Temanggung..." value={filters.origin} onChange={(event) => update('origin', event.target.value)} />
                    </label>
                </div>
                <footer className="filter-drawer-actions">
                    <button className="btn ghost wide" type="button" onClick={resetFilters}>Reset</button>
                    <button className="btn primary wide" type="button" onClick={onClose}>Show products</button>
                </footer>
            </aside>
        </div>
    );
}

function ProductSkeleton() {
    return (
        <div className="product-grid marketplace-product-grid">
            {Array.from({ length: 8 }).map((_, index) => (
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

function activeChips(categories, filters) {
    const chips = [];
    const category = categories.find((item) => item.slug === filters.category);

    if (filters.search) chips.push({ key: 'search', label: `Search: ${filters.search}` });
    if (filters.category) chips.push({ key: 'category', label: category?.name || filters.category });
    if (filters.roast_level) chips.push({ key: 'roast_level', label: optionLabel(ROAST_LEVEL_OPTIONS, filters.roast_level) });
    if (filters.origin) chips.push({ key: 'origin', label: `Origin: ${filters.origin}` });

    return chips;
}

function sortProducts(products, sort) {
    const price = (product) => Number(product.min_price ?? product.price ?? 0);
    const rating = (product) => Number(product.avg_rating || 0);

    return [...products].sort((a, b) => {
        if (sort === 'newest') return Number(b.id || 0) - Number(a.id || 0);
        if (sort === 'rating') return rating(b) - rating(a) || Number(b.reviews_count || 0) - Number(a.reviews_count || 0);
        if (sort === 'price-low') return price(a) - price(b);
        if (sort === 'price-high') return price(b) - price(a);

        return Number(b.stock || 0) - Number(a.stock || 0) || rating(b) - rating(a);
    });
}

function FilterIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 6h16" />
            <path d="M7 12h10" />
            <path d="M10 18h4" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
        </svg>
    );
}

function SortIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5h10" />
            <path d="M11 9h7" />
            <path d="M11 13h4" />
            <path d="M3 17l3 3 3-3" />
            <path d="M6 18V4" />
        </svg>
    );
}
