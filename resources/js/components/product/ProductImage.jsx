export default function ProductImage({ product, large = false, small = false }) {
    const src = product.image_url || product.image;
    const className = large ? 'product-image large' : small ? 'product-image small' : 'product-image';

    if (src) {
        return <img className={className} src={src} alt={product.name} />;
    }

    return <div className={`${className} placeholder`}>{product.name?.slice(0, 1) || 'K'}</div>;
}
