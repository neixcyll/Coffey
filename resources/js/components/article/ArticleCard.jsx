import ArticleImage from './ArticleImage.jsx';

export default function ArticleCard({ article, navigate, featured = false }) {
    const author = article.author?.creator_profile?.display_name || article.author?.name || 'Marketplace Kopi';
    const hasProducts = Number(article.recommended_products_count || 0) > 0 || article.has_recommended_products;

    const baseCardClass = `article-card overflow-hidden border border-[#e1d4c4] rounded-lg bg-[#fffdf9] shadow-[0_8px_24px_rgba(53,34,20,0.06)] transition-all duration-200 hover:-translate-y-[3px] hover:border-[#d7c4b4] hover:shadow-[0_18px_44px_rgba(53,34,20,0.12)] ${
        featured ? 'article-card-featured grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]' : ''
    }`;

    const bodyClass = `article-card-body grid gap-2.5 p-4 ${
        featured ? 'md:align-content-center md:p-6' : ''
    }`;

    return (
        <article className={baseCardClass}>
            <button className="article-image-button block w-full p-0 border-0 bg-transparent cursor-pointer" type="button" onClick={() => navigate('blog-detail', article.slug)}>
                <ArticleImage article={article} />
            </button>
            <div className={bodyClass}>
                <div className="market-product-topline flex flex-wrap gap-2 items-center">
                    <span className="tag text-xs font-bold uppercase text-[#b77825] tracking-wider">{article.category?.name || 'Coffee'}</span>
                    {hasProducts && <span className="badge verified text-xs bg-[#eaf4ef] text-[#2f6d56] px-2 py-0.5 rounded-full font-bold">Terhubung ke marketplace</span>}
                </div>
                <h3 className={`font-bold text-[#38291e] ${featured ? 'text-2xl md:text-3xl leading-tight' : 'text-lg'}`}>{article.title}</h3>
                <p className="muted text-[#75695d] text-sm leading-relaxed">{article.excerpt}</p>
                <div className="article-card-meta flex flex-wrap gap-2 text-xs font-semibold text-[#75695d] my-1">
                    <span className="border border-[#eadfd4] rounded-full px-2 py-1 bg-[#fff8ea]">{author}</span>
                    <span className="border border-[#eadfd4] rounded-full px-2 py-1 bg-[#fff8ea]">{readTime(article)} min read</span>
                    <span className="border border-[#eadfd4] rounded-full px-2 py-1 bg-[#fff8ea]">{article.published_at ? new Date(article.published_at).toLocaleDateString('id-ID') : '-'}</span>
                </div>
                <button className="btn ghost compact-btn" type="button" onClick={() => navigate('blog-detail', article.slug)}>
                    Baca Artikel
                </button>
            </div>
        </article>
    );
}

function readTime(article) {
    const text = `${article.title || ''} ${article.excerpt || ''}`;
    return Math.max(2, Math.ceil(text.split(/\s+/).filter(Boolean).length / 90));
}
