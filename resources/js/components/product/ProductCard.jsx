import { formatPrice } from '../../utils/format.js';
import StarRating from '../review/StarRating.jsx';
import ProductImage from './ProductImage.jsx';

export default function ProductCard({ product, navigate }) {
    const reviewsCount = Number(product.reviews_count || 0);
    const verified = product.seller?.status === 'active';
    const ratingLabel = Number(product.avg_rating || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 });

    return (
        <article className="market-product-card group overflow-hidden border border-[#e1d4c4] rounded-lg bg-[#fffdf9] shadow-[0_10px_30px_rgba(53,34,20,0.07)] transition-all duration-200 hover:-translate-y-[3px] hover:border-[#d7c4b4] hover:shadow-[0_18px_44px_rgba(53,34,20,0.12)]">
            <button className="market-product-image-button block w-full p-0 border-0 bg-transparent cursor-pointer overflow-hidden" type="button" onClick={() => navigate('product', product.slug || product.id)}>
                <div className="transition-transform duration-200 group-hover:scale-[1.035]">
                    <ProductImage product={product} />
                </div>
            </button>
            <div className="market-product-body grid gap-3 p-4">
                <div className="market-product-topline flex justify-between gap-2 items-center">
                    <span className="tag text-xs font-bold uppercase text-[#b77825] tracking-wider">{product.category?.name || 'Coffee'}</span>
                    {verified && <span className="badge verified text-xs bg-[#eaf4ef] text-[#2f6d56] px-2 py-0.5 rounded-full font-bold">Verified Seller</span>}
                </div>
                <div className="market-product-title-block grid gap-0.5">
                    <h3 className="text-lg font-bold text-[#38291e] line-clamp-1">{product.name}</h3>
                    <p className="muted text-[#75695d] text-[0.92rem]">{product.seller?.store_name || 'Seller kopi'}</p>
                </div>
                <div className="market-product-rating flex gap-2 items-center text-[#75695d] text-[0.9rem] font-semibold">
                    <StarRating value={product.avg_rating || 0} />
                    <span>{reviewsCount > 0 ? `${ratingLabel} (${reviewsCount})` : 'Belum ada rating'}</span>
                </div>
                <div className="market-product-purchase-row grid gap-3.5 border-t border-[#eadfd4] pt-4 mt-1">
                    <strong className="market-product-price text-[#38291e] text-[1.12rem] font-bold">{priceLabel(product)}</strong>
                    <div className="market-product-actions grid grid-cols-2 gap-2">
                        <button className="btn ghost" type="button" onClick={() => navigate('product', product.slug || product.id)}>View</button>
                        <button className="btn primary" type="button" onClick={() => navigate('product', product.slug || product.id)}>Choose</button>
                    </div>
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
