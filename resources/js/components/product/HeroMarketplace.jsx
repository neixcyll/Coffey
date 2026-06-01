import ProductImage from './ProductImage.jsx';

export default function HeroMarketplace({ navigate, product }) {
    return (
        <section className="marketplace-hero">
            <div className="marketplace-hero-copy">
                <p className="eyebrow">Coffee marketplace ecosystem</p>
                <h1>Discover Indonesian Coffee Beans</h1>
                <p>
                    Temukan beans lokal, brewing gear, dan rekomendasi kopi dari seller terpercaya.
                </p>
                <div className="row">
                    <button className="btn primary" type="button" onClick={() => document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' })}>
                        Lihat Produk
                    </button>
                    <button className="btn ghost" type="button" onClick={() => navigate('blog')}>
                        Explore Guide
                    </button>
                </div>
            </div>

            <div className="marketplace-hero-visual">
                {product ? (
                    <>
                        <ProductImage product={product} />
                        <div className="marketplace-hero-product">
                            <span className="tag">{product.category?.name || 'Coffee Beans'}</span>
                            <strong>{product.name}</strong>
                            <small>{product.seller?.store_name || 'Verified Seller'}</small>
                        </div>
                    </>
                ) : (
                    <div className="coffee-pattern-visual">
                        <span>K</span>
                    </div>
                )}
            </div>
        </section>
    );
}
