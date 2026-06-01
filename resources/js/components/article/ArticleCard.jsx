import ArticleImage from './ArticleImage.jsx';

export default function ArticleCard({ article, navigate, featured = false }) {
    const author = article.author?.creator_profile?.display_name || article.author?.name || 'Marketplace Kopi';
    const hasProducts = Number(article.recommended_products_count || 0) > 0 || article.has_recommended_products;

    return (
        <article className={featured ? 'article-card article-card-featured' : 'article-card'}>
            <button className="article-image-button" type="button" onClick={() => navigate('blog-detail', article.slug)}>
                <ArticleImage article={article} />
            </button>
            <div className="article-card-body">
                <div className="market-product-topline">
                    <span className="tag">{article.category?.name || 'Coffee'}</span>
                    {hasProducts && <span className="badge verified">Terhubung ke marketplace</span>}
                </div>
                <h3>{article.title}</h3>
                <p className="muted">{article.excerpt}</p>
                <div className="article-card-meta">
                    <span>{author}</span>
                    <span>{readTime(article)} min read</span>
                    <span>{article.published_at ? new Date(article.published_at).toLocaleDateString('id-ID') : '-'}</span>
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
