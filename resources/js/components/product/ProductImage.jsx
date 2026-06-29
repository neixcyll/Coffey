import { applyFallbackImage, fallbackProductImage } from '../../constants/images.js';

export default function ProductImage({ product, large = false, small = false }) {
    const fallback = fallbackProductImage(product);
    const src = product.image_url || product.image || fallback;
    const className = large ? 'product-image large' : small ? 'product-image small' : 'product-image';

    return <img className={className} src={src} alt={product.name || 'Coffee product'} onError={(event) => applyFallbackImage(event, fallback)} />;
}
