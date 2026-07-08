import ProductCard from './ProductCard.jsx';

export default function FeaturedProducts({ eyebrow, title, products, navigate }) {
    if (!products.length) return null;

    return (
        <section className="market-section flex flex-col gap-6">
            <div className="section-head flex justify-between gap-4 items-end border-b border-gray-200 pb-4">
                <div>
                    <p className="eyebrow text-xs font-black uppercase text-[#b77825] tracking-wider mb-2">{eyebrow}</p>
                    <h2 className="text-2xl font-bold text-[#38291e]">{title}</h2>
                </div>
            </div>
            <div className="featured-product-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[18px]">
                {products.map((product) => <ProductCard key={product.id} product={product} navigate={navigate} />)}
            </div>
        </section>
    );
}
