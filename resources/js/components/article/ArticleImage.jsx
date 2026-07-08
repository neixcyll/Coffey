import { applyFallbackImage, fallbackArticleImage } from '../../constants/images.js';

export default function ArticleImage({ article }) {
    const fallback = fallbackArticleImage(article);
    const src = article.featured_image_url || article.featured_image || fallback;

    return <img className="article-image w-full h-[210px] object-cover bg-[#dfe7e4] transition-transform duration-150 ease-in-out" src={src} alt={article.title || 'Coffee article'} onError={(event) => applyFallbackImage(event, fallback)} />;
}
