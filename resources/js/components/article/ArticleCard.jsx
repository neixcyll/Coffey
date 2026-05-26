import ArticleImage from './ArticleImage.jsx';

export default function ArticleCard({ article, navigate }) {
    return (
        <article className="article-card">
            <ArticleImage article={article} />
            <div className="article-card-body">
                <span className="tag">{article.category?.name}</span>
                <h3>{article.title}</h3>
                <p className="muted">{article.excerpt}</p>
                <div className="row between">
                    <small className="muted">{article.published_at ? new Date(article.published_at).toLocaleDateString('id-ID') : '-'}</small>
                    <button className="btn ghost compact-btn" onClick={() => navigate('blog-detail', article.slug)}>Baca</button>
                </div>
            </div>
        </article>
    );
}
