import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../../components/public/EmptyState.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';

export default function ContentLayerPage({ token, navigate, setNotice }) {
    const [articles, setArticles] = useState([]);
    const [activeArticle, setActiveArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [socialState, setSocialState] = useState(() => readSocialState());

    useEffect(() => {
        setLoading(true);
        apiRequest('/articles?affiliate_only=1&per_page=100')
            .then((response) => setArticles(rowsFrom(response)))
            .catch((error) => setNotice(error.message))
            .finally(() => setLoading(false));
    }, [setNotice]);

    const filteredArticles = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        if (!keyword) return articles;

        return articles.filter((article) => [
            article.title,
            article.excerpt,
            article.category?.name,
            creatorName(article),
            ...(article.recommended_products || []).map((item) => item.title || item.product?.name),
        ].filter(Boolean).some((value) => value.toLowerCase().includes(keyword)));
    }, [articles, query]);

    function updateSocial(articleId, updater) {
        setSocialState((current) => {
            const next = updater(current);
            localStorage.setItem('kopi_content_social', JSON.stringify(next));
            return next;
        });
    }

    function toggleFlag(articleId, key) {
        updateSocial(articleId, (current) => ({
            ...current,
            [articleId]: {
                ...(current[articleId] || {}),
                [key]: !current[articleId]?.[key],
            },
        }));
    }

    function addComment(articleId, comment) {
        const text = comment.trim();
        if (!text) return;

        updateSocial(articleId, (current) => ({
            ...current,
            [articleId]: {
                ...(current[articleId] || {}),
                comments: [
                    ...(current[articleId]?.comments || []),
                    { id: Date.now(), text, author: 'Customer', created_at: new Date().toISOString() },
                ],
            },
        }));
    }

    async function openArticle(article) {
        setActiveArticle(article);
        setDetailLoading(true);

        try {
            const response = await apiRequest(`/articles/${article.slug}`, { token });
            setActiveArticle(response.data);
        } catch (error) {
            setNotice(error.message);
        } finally {
            setDetailLoading(false);
        }
    }

    async function trackProductClick(article, item) {
        try {
            const response = await apiRequest(`/articles/${article.slug}/clicks`, {
                method: 'POST',
                token,
                body: {
                    article_product_id: item.id,
                    product_id: item.product_id || undefined,
                    target_url: item.external_url || undefined,
                    referrer: document.referrer || window.location.href,
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
            if (item.product?.slug) {
                navigate('product', item.product.slug);
                return;
            }

            if (item.external_url) {
                window.location.href = item.external_url;
                return;
            }

            setNotice(error.message);
        }
    }

    async function shareArticle(article) {
        const url = `${window.location.origin}/blog/${article.slug}`;
        await navigator.clipboard?.writeText(url);
        setNotice('Link postingan disalin.');
    }

    return (
        <section className="public-content-layer">
            <header className="content-community-hero">
                <div>
                    <p className="eyebrow">Content Layer</p>
                    <h1>Rekomendasi kopi dari affiliate dan creator.</h1>
                    <p>
                        Baca review, brewing tips, cerita pengalaman, dan rekomendasi produk kopi dari seluruh creator marketplace.
                    </p>
                </div>
                <div className="content-community-search">
                    <input
                        placeholder="Cari artikel, creator, produk, atau brewing tips"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />
                    <span>{articles.length} affiliate posts</span>
                </div>
            </header>

            {loading ? (
                <ContentSkeleton />
            ) : filteredArticles.length > 0 ? (
                <div className="community-feed-grid">
                    {filteredArticles.map((article) => (
                        <CommunityPostCard
                            key={article.id}
                            article={article}
                            state={socialState[article.id] || {}}
                            onRead={() => openArticle(article)}
                            onProductClick={(item) => trackProductClick(article, item)}
                            onToggle={(key) => toggleFlag(article.id, key)}
                            onShare={() => shareArticle(article)}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    eyebrow="Content"
                    title="Belum ada postingan yang cocok."
                    message="Coba gunakan kata kunci lain untuk menemukan rekomendasi kopi dari creator."
                />
            )}

            {activeArticle && (
                <ContentDetailDrawer
                    article={activeArticle}
                    state={socialState[activeArticle.id] || {}}
                    loading={detailLoading}
                    onClose={() => setActiveArticle(null)}
                    onProductClick={(item) => trackProductClick(activeArticle, item)}
                    onToggle={(key) => toggleFlag(activeArticle.id, key)}
                    onShare={() => shareArticle(activeArticle)}
                    onComment={(comment) => addComment(activeArticle.id, comment)}
                />
            )}
        </section>
    );
}

function CommunityPostCard({ article, state, onRead, onProductClick, onToggle, onShare }) {
    const products = article.recommended_products || [];

    return (
        <article className="community-post-card">
            <button className="community-post-cover" type="button" onClick={onRead}>
                {article.featured_image_url ? <img src={article.featured_image_url} alt={article.title} /> : <span>{article.title?.slice(0, 1) || 'C'}</span>}
            </button>
            <div className="community-post-body">
                <div className="market-product-topline">
                    <span className="tag">{article.category?.name || 'Coffee Story'}</span>
                    <small>{formatDate(article.published_at)}</small>
                </div>
                <button className="community-post-title" type="button" onClick={onRead}>{article.title}</button>
                <p className="muted">{article.excerpt || 'Baca rekomendasi lengkap dari creator.'}</p>
                <div className="creator-chip">
                    <span>{creatorInitials(article)}</span>
                    <strong>{creatorName(article)}</strong>
                </div>
                {products.length > 0 && (
                    <div className="community-product-strip">
                        {products.slice(0, 3).map((item) => (
                            <button key={item.id} type="button" onClick={() => onProductClick(item)}>
                                {item.image_url ? <img src={item.image_url} alt={item.title} /> : <span>{item.title?.slice(0, 1) || 'P'}</span>}
                                <small>{item.title}</small>
                            </button>
                        ))}
                    </div>
                )}
                <SocialActions
                    liked={state.liked}
                    saved={state.saved}
                    commentsCount={(state.comments || []).length}
                    onLike={() => onToggle('liked')}
                    onSave={() => onToggle('saved')}
                    onShare={onShare}
                    onDiscuss={onRead}
                />
            </div>
        </article>
    );
}

function ContentDetailDrawer({ article, state, loading, onClose, onProductClick, onToggle, onShare, onComment }) {
    const [comment, setComment] = useState('');
    const products = article.recommended_products || [];

    function submitComment(event) {
        event.preventDefault();
        onComment(comment);
        setComment('');
    }

    return (
        <div className="content-detail-shell">
            <button className="cart-drawer-backdrop" type="button" aria-label="Tutup detail content" onClick={onClose} />
            <article className="content-detail-drawer">
                <header className="cart-drawer-header">
                    <div>
                        <p className="eyebrow">{article.category?.name || 'Content Detail'}</p>
                        <h2>{article.title}</h2>
                    </div>
                    <button className="icon-button" type="button" aria-label="Tutup detail content" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </header>
                <div className="content-detail-scroll">
                    {article.featured_image_url && <img className="content-detail-cover" src={article.featured_image_url} alt={article.title} />}
                    <div className="creator-chip">
                        <span>{creatorInitials(article)}</span>
                        <strong>{creatorName(article)}</strong>
                    </div>
                    {loading && <p className="muted">Memuat detail postingan...</p>}
                    <p className="article-excerpt">{article.excerpt}</p>
                    <div className="article-body">{plainParagraphs(article.content || article.excerpt || '').map((paragraph, index) => <p key={`${article.id}-${index}`}>{paragraph}</p>)}</div>
                    {products.length > 0 && (
                        <section className="detail-recommended-products">
                            <p className="eyebrow">Recommended Products</p>
                            {products.map((item) => (
                                <button key={item.id} type="button" onClick={() => onProductClick(item)}>
                                    {item.image_url ? <img src={item.image_url} alt={item.title} /> : <span>{item.title?.slice(0, 1) || 'P'}</span>}
                                    <span>
                                        <strong>{item.title}</strong>
                                        <small>{item.product ? formatPrice(item.product.price || item.price) : item.price_label || item.external_platform || 'Affiliate link'}</small>
                                    </span>
                                </button>
                            ))}
                        </section>
                    )}
                    <SocialActions
                        liked={state.liked}
                        saved={state.saved}
                        commentsCount={(state.comments || []).length}
                        onLike={() => onToggle('liked')}
                        onSave={() => onToggle('saved')}
                        onShare={onShare}
                        onDiscuss={() => document.getElementById('content-discussion')?.scrollIntoView({ behavior: 'smooth' })}
                    />
                    <section className="content-discussion" id="content-discussion">
                        <p className="eyebrow">Discussion</p>
                        <form className="content-comment-form" onSubmit={submitComment}>
                            <input placeholder="Tulis komentar atau diskusi kopi..." value={comment} onChange={(event) => setComment(event.target.value)} />
                            <button className="btn primary" type="submit">Send</button>
                        </form>
                        <div className="content-comment-list">
                            {(state.comments || []).map((item) => (
                                <div className="content-comment" key={item.id}>
                                    <strong>{item.author}</strong>
                                    <p>{item.text}</p>
                                </div>
                            ))}
                            {!(state.comments || []).length && <p className="muted">Belum ada diskusi. Mulai percakapan tentang rekomendasi ini.</p>}
                        </div>
                    </section>
                </div>
            </article>
        </div>
    );
}

function SocialActions({ liked, saved, commentsCount, onLike, onSave, onShare, onDiscuss }) {
    return (
        <div className="content-social-actions">
            <button className={liked ? 'active' : ''} type="button" onClick={onLike}>Like</button>
            <button className={saved ? 'active' : ''} type="button" onClick={onSave}>Save</button>
            <button type="button" onClick={onShare}>Share</button>
            <button type="button" onClick={onDiscuss}>Discuss {commentsCount > 0 ? commentsCount : ''}</button>
        </div>
    );
}

function ContentSkeleton() {
    return (
        <div className="community-feed-grid">
            {Array.from({ length: 6 }).map((_, index) => (
                <article className="community-post-card skeleton-card" key={index}>
                    <div className="skeleton-image" />
                    <div className="product-body">
                        <span />
                        <strong />
                        <p />
                    </div>
                </article>
            ))}
        </div>
    );
}

function creatorName(article) {
    return article.author?.creator_profile?.display_name || article.author?.name || 'Coffee Creator';
}

function creatorInitials(article) {
    return creatorName(article).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function formatDate(value) {
    if (!value) return 'New post';
    return new Date(value).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
}

function plainParagraphs(value) {
    return String(value || '').split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
}

function readSocialState() {
    try {
        return JSON.parse(localStorage.getItem('kopi_content_social') || '{}');
    } catch {
        return {};
    }
}

function CloseIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
        </svg>
    );
}
