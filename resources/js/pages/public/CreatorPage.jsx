import { useEffect, useState } from 'react';
import ArticleCard from '../../components/article/ArticleCard.jsx';
import { apiRequest } from '../../services/api.js';

export default function CreatorPage({ username, navigate, setNotice }) {
    const [profile, setProfilee] = useState(null);
    const [articles, setArticles] = useState([]);

    useEffect(() => {
        if (!username) return;
        apiRequest(`/creators/${username}`)
            .then((response) => {
                setProfilee(response.data.profile);
                setArticles(response.data.articles?.data || []);
            })
            .catch((error) => setNotice(error.message));
    }, [username, setNotice]);

    if (!profile) return <p className="muted">Memuat creator...</p>;

    return (
        <section className="content-page">
            <div className="creator-header">
                <div className="author-avatar large">{profile.display_name?.slice(0, 1) || 'K'}</div>
                <div>
                    <p className="eyebrow">Creator</p>
                    <h1>{profile.display_name}</h1>
                    <p className="muted">{profile.bio || 'Creator kopi di Marketplace Kopi.'}</p>
                    {profile.affiliate_code && <code>{profile.affiliate_code}</code>}
                </div>
            </div>
            <div className="article-grid">
                {articles.map((article) => <ArticleCard key={article.id} article={article} navigate={navigate} />)}
            </div>
            {articles.length === 0 && <p className="muted">Creator ini belum memiliki artikel published.</p>}
        </section>
    );
}
