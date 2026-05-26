import { useEffect, useState } from 'react';
import { CATEGORY_ROUTE_MAP } from '../../constants/options.js';
import ArticleCard from '../../components/article/ArticleCard.jsx';
import ArticleImage from '../../components/article/ArticleImage.jsx';
import { apiRequest } from '../../services/api.js';
import { rowsFrom } from '../../utils/format.js';

export default function BlogIndexPage({ categorySlug = '', navigate, setNotice }) {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(categorySlug);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setSelectedCategory(categorySlug);
    }, [categorySlug]);

    useEffect(() => {
        apiRequest('/article-categories')
            .then((response) => setCategories(response.data || []))
            .catch((error) => setNotice(error.message));
    }, [setNotice]);

    useEffect(() => {
        const query = new URLSearchParams();
        if (selectedCategory) query.set('category', selectedCategory);
        if (search) query.set('search', search);
        setLoading(true);
        apiRequest(`/articles?${query}`)
            .then((response) => setArticles(rowsFrom(response)))
            .catch((error) => setNotice(error.message))
            .finally(() => setLoading(false));
    }, [selectedCategory, search, setNotice]);

    function openCategory(category) {
        const route = CATEGORY_ROUTE_MAP[category.slug];
        if (route) {
            navigate(route);
            return;
        }

        setSelectedCategory(category.slug);
    }

    const activeCategory = categories.find((category) => category.slug === selectedCategory);
    const title = activeCategory ? activeCategory.name : 'Coffee Journal';
    const featured = articles[0];
    const rest = featured ? articles.slice(1) : articles;

    return (
        <section className="content-page">
            <div className="content-hero">
                <div>
                    <p className="eyebrow">Content layer</p>
                    <h1>{title}</h1>
                    <p className="muted">Review, brewing guide, comparison, dan rekomendasi produk yang terhubung langsung ke marketplace.</p>
                </div>
                <div className="content-search">
                    <input placeholder="Cari artikel kopi" value={search} onChange={(event) => setSearch(event.target.value)} />
                </div>
            </div>

            <div className="category-tabs">
                <button className={!selectedCategory ? 'active' : ''} onClick={() => { setSelectedCategory(''); navigate('blog'); }}>Semua</button>
                {categories.map((category) => (
                    <button key={category.id} className={selectedCategory === category.slug ? 'active' : ''} onClick={() => openCategory(category)}>
                        {category.name}
                    </button>
                ))}
            </div>

            {loading ? <p className="muted">Memuat artikel...</p> : (
                <>
                    {featured && (
                        <article className="featured-article">
                            <ArticleImage article={featured} />
                            <div className="featured-copy">
                                <span className="tag">{featured.category?.name}</span>
                                <h2>{featured.title}</h2>
                                <p className="muted">{featured.excerpt}</p>
                                <div className="row">
                                    <button className="btn primary" onClick={() => navigate('blog-detail', featured.slug)}>Baca artikel</button>
                                    {featured.author?.creator_profile?.username && (
                                        <button className="btn ghost" onClick={() => navigate('creator', featured.author.creator_profile.username)}>
                                            {featured.author.creator_profile.display_name}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </article>
                    )}

                    <div className="article-grid">
                        {rest.map((article) => <ArticleCard key={article.id} article={article} navigate={navigate} />)}
                    </div>
                    {articles.length === 0 && <p className="muted">Belum ada artikel published untuk kategori ini.</p>}
                </>
            )}
        </section>
    );
}
