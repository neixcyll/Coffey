import { applyFallbackImage, fallbackProductImage } from '../../constants/images.js';

export default function ProductImage({ product, large = false, small = false }) {
    const fallback = fallbackProductImage(product);
    const src = product.image_url || product.image || fallback;

    let baseClass = 'object-cover bg-[#f4eee6] w-full h-full absolute inset-0 ';

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
