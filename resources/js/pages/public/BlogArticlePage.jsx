import { useEffect, useState } from 'react';
import ArticleCard from '../../components/article/ArticleCard.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';
import { applyArticleSeo } from '../../utils/seo.js';

export default function BlogArticlePage({ slug, token, navigate, setNotice }) {
    const [article, setArticle] = useState(null);

    useEffect(() => {
        if (!slug) return;
        apiRequest(`/articles/${slug}`)
            .then((response) => {
                setArticle(response.data);
                applyArticleSeo(response.data);
            })
            .catch((error) => setNotice(error.message));
    }, [slug, setNotice]);

    async function trackProductClick(item) {
        if (!article) return;

        try {
            const response = await apiRequest(`/articles/${article.slug}/clicks`, {
                method: 'POST',
                token,
                body: {
                    article_product_id: item.id,
                    product_id: item.product_id || undefined,
                    target_url: item.external_url || undefined,
                    referrer: document.referrer || window.location.href,
                    landing_url: window.location.href,
                },
            });
            const payload = response.data;

            if (payload.affiliate_code) localStorage.setItem('affiliate_ref', payload.affiliate_code);
            if (payload.affiliate_click_id) localStorage.setItem('affiliate_click_id', payload.affiliate_click_id);

            if (payload.internal && item.product) {
                navigate('product', item.product.slug || item.product.id);
                return;
            }

            if (payload.target_url) {
                window.location.href = payload.target_url;
                return;
            }

            setNotice('Link produk belum tersedia.');
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!article) return <p className="muted">Memuat artikel...</p>;

    const authorProfile = article.author?.creator_profile;
    const paragraphs = (article.content || '').split(/\n{2,}/).filter(Boolean);

    return (
        <article className="article-layout">
            <header className="article-header">
                <span className="tag">{article.category?.name}</span>
                <h1>{article.title}</h1>
                <p className="article-excerpt">{article.excerpt}</p>
                <div className="article-meta">
                    <span>{authorProfile?.display_name || article.author?.name}</span>
                    <span>{article.published_at ? new Date(article.published_at).toLocaleDateString('id-ID') : '-'}</span>
                    <span>{article.views_count || 0} views</span>
                </div>
            </header>

            {article.featured_image_url && <img className="article-cover" src={article.featured_image_url} alt={article.title} />}

            <div className="article-body">
                {paragraphs.map((paragraph, index) => <p key={`${article.id}-p-${index}`}>{paragraph}</p>)}
            </div>

            {(article.recommended_products || []).length > 0 && (
                <section className="recommended-section">
                    <div className="section-head">
                        <div>
                            <p className="eyebrow">Recommended Products</p>
                            <h2>Produk yang disebut di artikel</h2>
                        </div>
                    </div>
                    <div className="recommended-grid">
                        {article.recommended_products.map((item) => (
                            <div className="recommended-card" key={item.id}>
                                {item.image_url ? <img src={item.image_url} alt={item.title} /> : <div className="product-image small placeholder">{item.title?.slice(0, 1) || 'K'}</div>}
                                <div>
                                    <span className="tag">{item.internal_available ? 'Marketplace' : item.external_platform || 'External'}</span>
                                    <h3>{item.title}</h3>
                                    <p className="muted">{item.description}</p>
                                    <strong>{item.internal_available ? formatPrice(item.price) : item.price_label || 'Cek harga terbaru'}</strong>
                                </div>
                                <button className={item.internal_available ? 'btn primary wide' : 'btn ghost wide'} onClick={() => trackProductClick(item)}>
                                    {item.cta_label}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="author-box">
                <div className="author-avatar">{(authorProfile?.display_name || article.author?.name || 'K').slice(0, 1)}</div>
                <div>
                    <p className="eyebrow">Author</p>
                    <h2>{authorProfile?.display_name || article.author?.name}</h2>
                    <p className="muted">{authorProfile?.bio || 'Creator dan reviewer kopi di Marketplace Kopi.'}</p>
                    {authorProfile?.username && <button className="btn ghost" onClick={() => navigate('creator', authorProfile.username)}>Lihat profil creator</button>}
                </div>
            </section>

            {(article.related_articles || []).length > 0 && (
                <section>
                    <div className="section-head">
                        <div>
                            <p className="eyebrow">Artikel terkait</p>
                            <h2>Baca selanjutnya</h2>
                        </div>
                    </div>
                    <div className="article-grid">
                        {article.related_articles.map((related) => <ArticleCard key={related.id} article={related} navigate={navigate} />)}
                    </div>
                </section>
            )}
        </article>
    );
}
