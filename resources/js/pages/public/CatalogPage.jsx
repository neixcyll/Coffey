import { useEffect, useState } from 'react';
import { ROAST_LEVEL_OPTIONS } from '../../constants/options.js';
import ProductImage from '../../components/product/ProductImage.jsx';
import StarRating from '../../components/review/StarRating.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, optionLabel } from '../../utils/format.js';

export default function CatalogPage({ navigate, setNotice }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', category: '', roast_level: '', origin: '' });

    useEffect(() => {
        apiRequest('/categories').then((data) => setCategories(data.data));
    }, []);

    useEffect(() => {
        const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
        setLoading(true);
        apiRequest(`/products?${query}`)
            .then((data) => setProducts(data.data || []))
            .catch((error) => setNotice(error.message))
            .finally(() => setLoading(false));
    }, [filters, setNotice]);

    return (
        <section>
            <div className="section-head">
                <div>
                    <p className="eyebrow">Katalog kopi</p>
                    <h1>Produk kopi dari seller</h1>
                </div>
            </div>
            <div className="filters">
                <input placeholder="Cari kopi, origin, atau deskripsi" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
                <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
                    <option value="">Semua kategori</option>
                    {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                </select>
                <select value={filters.roast_level} onChange={(event) => setFilters({ ...filters, roast_level: event.target.value })}>
                    <option value="">Roast level</option>
                    {ROAST_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <input placeholder="Origin" value={filters.origin} onChange={(event) => setFilters({ ...filters, origin: event.target.value })} />
            </div>
            {loading ? (
                <p className="muted">Memuat produk...</p>
            ) : (
                <div className="product-grid">
                    {products.map((product) => (
                        <article className="product-card" key={product.id}>
                            <ProductImage product={product} />
                            <div className="product-body">
                                <div>
                                    <span className="tag">{product.category?.name}</span>
                                    <h3>{product.name}</h3>
                                    <div className="rating-line compact">
                                        {Number(product.reviews_count || 0) > 0 ? (
                                            <>
                                                <StarRating value={product.avg_rating} />
                                                <span>{Number(product.avg_rating).toLocaleString('id-ID', { maximumFractionDigits: 1 })} ({product.reviews_count})</span>
                                            </>
                                        ) : (
                                            <span className="muted">Belum ada rating</span>
                                        )}
                                    </div>
                                    <p className="muted">{product.origin} - {optionLabel(ROAST_LEVEL_OPTIONS, product.roast_level)}</p>
                                </div>
                                <strong>{priceLabel(product)}</strong>
                                <div className="row">
                                    <button className="btn ghost" onClick={() => navigate('product', product.slug || product.id)}>Detail</button>
                                    <button className="btn primary" onClick={() => navigate('product', product.slug || product.id)}>Pilih Varian</button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function priceLabel(product) {
    const min = Number(product.min_price ?? product.price ?? 0);
    const max = Number(product.max_price ?? product.price ?? min);

    return max > min ? `${formatPrice(min)} - ${formatPrice(max)}` : formatPrice(min);
}
