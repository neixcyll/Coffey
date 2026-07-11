import { useEffect, useState } from 'react';
import ArticleCard from '../../components/article/ArticleCard.jsx';
import CategoryChips from '../../components/article/CategoryChips.jsx';
import ContentHero from '../../components/article/ContentHero.jsx';
import EmptyState from '../../components/public/EmptyState.jsx';
import { CATEGORY_ROUTE_MAP } from '../../constants/options.js';
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
        query.set('per_page', '100');
        setLoading(true);
        apiRequest(`/articles?${query}`)
            .then((response) => setArticles(rowsFrom(response)))
            .catch((error) => setNotice(error.message))
            .finally(() => setLoading(false));
    }, [selectedCategory, search, setNotice]);

    function openCategory(category) {
        if (!category.slug) {
            setSelectedCategory('');
            navigate('blog');
            return;
        }

        const route = CATEGORY_ROUTE_MAP[category.slug];
        if (route) {
            navigate(route);
            return;
        }

        setSelectedCategory(category.slug);
    }

    const title = pageTitle(categories, selectedCategory);
    const featured = articles[0];
    const rest = featured ? articles.slice(1) : articles;

    return (
        <section className="content-page explore-page">
            <ContentHero title={title} search={search} setSearch={setSearch} navigate={navigate} />
            <CategoryChips categories={categories} selectedCategory={selectedCategory} onSelect={openCategory} />

            {loading ? (
                <ArticleSkeleton />
            ) : (
                <div className="explore-layout" id="explore-articles">
                    <div className="explore-main">
                        {featured && <ArticleCard article={featured} navigate={navigate} featured />}
                        <div className="article-grid">
                            {rest.map((article) => <ArticleCard key={article.id} article={article} navigate={navigate} />)}
                        </div>
                        {articles.length === 0 && (
                            <EmptyState
                                eyebrow="Artikel"
                                title="Belum ada artikel published untuk kategori ini."
                                message="Categories ini belum punya konten aktif. Lihat semua artikel untuk rekomendasi kopi lainnya."
                                actionLabel="Lihat semua artikel"
                                onAction={() => openCategory({ slug: '' })}
                            />
                        )}
                    </div>

                    <aside className="explore-sidebar">
                        <div className="panel">
                            <p className="eyebrow">Trending Topics</p>
                            <h2>Topik kopi</h2>
                            <div className="topic-list">
                                {categories.filter((category) => Number(category.articles_count || 0) > 0).slice(0, 8).map((category) => (
                                    <button key={category.id} type="button" onClick={() => openCategory(category)}>
                                        <span>{category.name}</span>
                                        <small>{category.articles_count} artikel</small>
                                    </button>
                                ))}
                                {categories.length === 0 && <p className="muted">Categories artikel belum tersedia.</p>}
                            </div>
                        </div>
                    </aside>
                </div>
            )}
        </section>
    );
}

function pageTitle(categories, selectedCategory) {
    if (!selectedCategory) return 'Explore Coffee Journal';

    const category = categories.find((item) => item.slug === selectedCategory);
    if (category) return category.name;

    return selectedCategory
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function ArticleSkeleton() {
    return (
        <div className="article-grid">
            {Array.from({ length: 4 }).map((_, index) => (
                <div className="article-card skeleton-card" key={index}>
                    <div className="skeleton-image" />
                    <div className="article-card-body">
                        <span />
                        <strong />
                        <p />
                    </div>
                </div>
            ))}
        </div>
    );
}
