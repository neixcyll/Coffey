export default function ArticleImage({ article }) {
    const src = article.featured_image_url || article.featured_image;

    if (src) return <img className="article-image" src={src} alt={article.title} />;

    return <div className="article-image placeholder">{article.title?.slice(0, 1) || 'K'}</div>;
}
