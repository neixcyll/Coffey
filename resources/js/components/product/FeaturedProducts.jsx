import ProductCard from './ProductCard.jsx';

export default function FeaturedProducts({ eyebrow, title, products, navigate }) {
    if (!products.length) return null;

    return (
        <section className="market-section">
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
