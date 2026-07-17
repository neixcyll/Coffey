import { formatPrice } from '../../utils/format.js';
import StarRating from '../review/StarRating.jsx';
import ProductImage from './ProductImage.jsx';

export default function ProductCard({ product, navigate }) {
    const reviewsCount = Number(product.reviews_count || 0);
    const verified = product.seller?.status === 'active';
    const ratingLabel = Number(product.avg_rating || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 });

    return (
        <article className="market-product-card group overflow-hidden border border-[#e1d4c4] rounded-lg bg-[#fffdf9] shadow-[0_10px_30px_rgba(53,34,20,0.07)] transition-all duration-200 hover:-translate-y-[3px] hover:border-[#d7c4b4] hover:shadow-[0_18px_44px_rgba(53,34,20,0.12)] flex flex-col h-full">
            <button className="market-product-image-button block w-full relative aspect-[4/3] border-0 bg-transparent cursor-pointer overflow-hidden" type="button" onClick={() => navigate('product', product.slug || product.id)}>
                <ProductImage product={product} />
            </button>
            <div className="market-product-body grid gap-2 p-3 flex-1 content-start">
                <div className="market-product-topline flex justify-between gap-2 items-center">
                    <span className="tag text-[0.68rem] font-bold uppercase text-[#b77825] tracking-wider">{product.category?.name || 'Coffee'}</span>
                    {verified && <span className="badge verified text-[0.68rem] bg-[#eaf4ef] text-[#2f6d56] px-1.5 py-0.5 rounded-full font-bold">Verified</span>}
                </div>
                <div className="market-product-title-block grid gap-0.5">
                    <h3 className="text-[0.95rem] font-bold text-[#38291e] line-clamp-1">{product.name}</h3>
                    <p className="muted text-[#75695d] text-xs">{product.seller?.store_name || 'Seller kopi'}</p>
                </div>
                <div className="market-product-rating flex gap-1.5 items-center text-[#75695d] text-xs font-semibold">
                    <StarRating value={product.avg_rating || 0} />
                    <span>{reviewsCount > 0 ? `${ratingLabel} (${reviewsCount})` : 'Belum ada rating'}</span>
                </div>
                <div className="market-product-purchase-row grid gap-2.5 border-t border-[#eadfd4] pt-3 mt-0.5">
                    <strong className="market-product-price text-[#38291e] text-sm font-bold">{priceLabel(product)}</strong>
                    <div className="market-product-actions grid grid-cols-2 gap-1.5">
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
