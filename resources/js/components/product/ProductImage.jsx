import { applyFallbackImage, fallbackProductImage } from '../../constants/images.js';

export default function ProductImage({ product, large = false, small = false }) {
    const fallback = fallbackProductImage(product);
    const src = product.image_url || product.image || fallback;

    let baseClass = 'object-cover bg-gray-100 ';
    if (large) {
        baseClass += 'w-full h-[min(520px,66vh)] rounded-lg';
    } else if (small) {
        baseClass += 'w-full h-full rounded-lg';
    } else {
        baseClass += 'w-full h-[180px] rounded-lg';
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
