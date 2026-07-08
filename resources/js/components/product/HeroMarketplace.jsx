import ProductImage from './ProductImage.jsx';

export default function HeroMarketplace({ navigate, product }) {
    return (
        <section className="marketplace-hero relative grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] gap-7 items-center overflow-hidden border border-[#e1d4c4] rounded-lg p-6 md:p-11 bg-[radial-gradient(circle_at_82%_18%,rgba(47,109,86,0.18),transparent_30%),linear-gradient(135deg,#fffaf2,#eee1d1)] shadow-[0_18px_60px_rgba(53,34,20,0.1)]">
            <div className="marketplace-hero-copy grid gap-4 max-w-[680px]">
                <p className="eyebrow text-xs font-black uppercase text-[#b77825] tracking-wider">Coffee marketplace ecosystem</p>
                <h1 className="max-w-[780px] m-0 text-3xl md:text-5xl font-extrabold tracking-tight leading-none text-[#111111]">Discover Indonesian Coffee Beans</h1>
                <p className="max-w-[620px] m-0 text-[#5d5146] text-base leading-relaxed">
                    Temukan beans lokal, brewing gear, dan rekomendasi kopi dari seller terpercaya.
                </p>
                <div className="flex flex-wrap gap-2.5 mt-2">
                    <button className="btn primary" type="button" onClick={() => document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' })}>
                        Lihat Produk
                    </button>
                    <button className="btn ghost" type="button" onClick={() => navigate('blog')}>
                        Explore Guide
                    </button>
                </div>
            </div>

            <div className="marketplace-hero-visual relative min-h-[340px] overflow-hidden border border-[#d9cbbc] rounded-lg bg-[linear-gradient(135deg,rgba(43,27,19,0.18),rgba(47,109,86,0.18)),#f7f3ec]">
                {product ? (
                    <>
                        <ProductImage product={product} large />
                        <div className="marketplace-hero-product absolute right-4 bottom-4 grid gap-1.5 w-[min(280px,calc(100%-32px))] border border-[rgba(255,253,249,0.7)] rounded-lg p-3 bg-[rgba(255,253,249,0.9)] shadow-[0_14px_36px_rgba(38,28,21,0.16)]">
                            <span className="tag text-xs font-bold text-[#b77825] uppercase tracking-wider">{product.category?.name || 'Coffee Beans'}</span>
                            <strong className="text-[#38291e] font-extrabold">{product.name}</strong>
                            <small className="text-[#75695d] text-xs font-medium">{product.seller?.store_name || 'Verified Seller'}</small>
                        </div>
                    </>
                ) : (
                    <div className="coffee-pattern-visual grid min-h-[340px] place-items-center bg-[linear-gradient(45deg,rgba(91,56,37,0.18)_25%,transparent_25%_50%,rgba(47,109,86,0.14)_50%_75%,transparent_75%),#f7f3ec]">
                        <span className="text-5xl font-black text-[#5b3825] opacity-[0.28]">K</span>
                    </div>
                )}
            </div>
        </section>
    );
}
