import { applyFallbackImage, fallbackProductImage } from '../../constants/images.js';

export default function ProductImage({ product, large = false, small = false }) {
    const fallback = fallbackProductImage(product);
    const src = product.image_url || product.image || fallback;

    let baseClass = 'product-image object-cover bg-[#e8dfd2] ';
    if (large) {
        baseClass += 'large w-full h-[min(520px,66vh)] rounded-lg';
    } else if (small) {
        baseClass += 'small w-[76px] h-[76px] flex-shrink-0 rounded-lg';
    } else {
        baseClass += 'w-full h-[180px]';
    }

    return (
        <img
            className={baseClass}
            src={src}
            alt={product.name || 'Coffee product'}
            loading={large ? 'eager' : 'lazy'}
            decoding="async"
            onError={(event) => applyFallbackImage(event, fallback)}
        />
    );
}
