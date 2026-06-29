import { ROAST_LEVEL_OPTIONS } from '../../constants/options.js';
import { formatPrice, optionLabel } from '../../utils/format.js';
import StarRating from '../review/StarRating.jsx';
import ProductImage from './ProductImage.jsx';

export default function ProductCard({ product, navigate }) {
    const reviewsCount = Number(product.reviews_count || 0);
    const verified = product.seller?.status === 'active';
    const brewMethod = (product.brewing_methods || [])[0]?.name;

    return (
        <article className="market-product-card">
            <button className="market-product-image-button" type="button" onClick={() => navigate('product', product.slug || product.id)}>
                <ProductImage product={product} />
            </button>
            <div className="market-product-body">
                <div className="market-product-topline">
                    <span className="tag">{product.category?.name || 'Coffee'}</span>
                    {verified && <span className="badge verified">Verified Seller</span>}
                </div>
                <div>
                    <h3>{product.name}</h3>
                    <p className="muted">{product.seller?.store_name || 'Seller kopi'}</p>
                </div>
                <div className="rating-line compact">
                    {reviewsCount > 0 ? (
                        <>
                            <StarRating value={product.avg_rating} />
                            <span>{Number(product.avg_rating).toLocaleString('id-ID', { maximumFractionDigits: 1 })} ({reviewsCount})</span>
                        </>
                    ) : (
                        <span className="muted">Belum ada rating</span>
                    )}
                </div>
                <div className="market-product-meta">
                    <span>{product.origin || 'Origin belum diisi'}</span>
                    <span>{optionLabel(ROAST_LEVEL_OPTIONS, product.roast_level)}</span>
                    {brewMethod && <span>{brewMethod}</span>}
                </div>
                <strong className="market-product-price">{priceLabel(product)}</strong>
                <div className="market-product-actions">
                    <button className="btn ghost" type="button" onClick={() => navigate('product', product.slug || product.id)}>View</button>
                    <button className="btn primary" type="button" onClick={() => navigate('product', product.slug || product.id)}>Choose</button>
                </div>
            </div>
        </article>
    );
}

function priceLabel(product) {
    const min = Number(product.min_price ?? product.price ?? 0);
    const max = Number(product.max_price ?? product.price ?? min);

    return max > min ? `${formatPrice(min)} - ${formatPrice(max)}` : formatPrice(min);
}
