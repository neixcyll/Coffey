import { useEffect, useState } from 'react';
import NeedCustomerAccount from '../../components/common/NeedCustomerAccount.jsx';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import Stat from '../../components/common/Stat.jsx';
import TextArea from '../../components/common/TextArea.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import { roleName } from '../../utils/route.js';

function emptyArticleForm() {
    return {
        article_category_id: '',
        title: '',
        excerpt: '',
        content: '',
        featured_image: '',
        meta_title: '',
        meta_description: '',
        status: 'pending',
        external_title: '',
        external_platform: '',
        external_url: '',
        external_price_label: '',
    };
}

export default function AffiliateContentPage({ token, user, navigate, setNotice, logout }) {
    const [summary, setSummary] = useState(null);
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(emptyArticleForm());
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [editingArticle, setEditingArticle] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!token) return;
        loadContent();
    }, [token]);

    async function loadContent() {
        try {
            const [summaryResponse, articleResponse, categoryResponse, productResponse] = await Promise.all([
                apiRequest('/affiliate/content/summary', { token }),
                apiRequest('/affiliate/content/articles', { token }),
                apiRequest('/affiliate/content/categories', { token }),
                apiRequest('/products?per_page=100'),
            ]);

            setSummary(summaryResponse.data);
            setArticles(rowsFrom(articleResponse));
            setCategories(categoryResponse.data || []);
            setProducts(rowsFrom(productResponse));
        } catch (error) {
            setNotice(error.message);
        }
    }

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    function toggleProduct(productId) {
        setSelectedProductIds((current) => {
            const id = String(productId);
            return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
        });
    }

    function editArticle(article) {
        const external = (article.recommended_products || []).find((item) => !item.product_id) || {};
        setEditingArticle(article);
        setForm({
            article_category_id: article.category?.id || '',
            title: article.title || '',
            excerpt: article.excerpt || '',
            content: article.content || '',
            featured_image: article.featured_image || article.featured_image_url || '',
            meta_title: article.meta_title || '',
            meta_description: article.meta_description || '',
            status: article.status === 'draft' ? 'draft' : 'pending',
            external_title: external.title || '',
            external_platform: external.external_platform || '',
            external_url: external.external_url || '',
            external_price_label: external.price_label || '',
        });
        setSelectedProductIds((article.recommended_products || []).filter((item) => item.product_id).map((item) => String(item.product_id)));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetForm() {
        setEditingArticle(null);
        setForm(emptyArticleForm());
        setSelectedProductIds([]);
    }

    async function saveArticle(event) {
        event.preventDefault();
        setSaving(true);

        const recommendations = selectedProductIds.map((productId, index) => ({
            product_id: Number(productId),
            sort_order: index,
        }));

        if (form.external_title || form.external_url) {
            recommendations.push({
                custom_title: form.external_title,
                external_platform: form.external_platform,
                external_url: form.external_url,
                external_price_label: form.external_price_label,
                sort_order: recommendations.length,
            });
        }

        const payload = {
            article_category_id: Number(form.article_category_id),
            title: form.title,
            excerpt: form.excerpt,
            content: form.content,
            featured_image: form.featured_image,
            meta_title: form.meta_title,
            meta_description: form.meta_description,
            status: form.status,
            recommendations,
        };

        try {
            const path = editingArticle ? `/affiliate/content/articles/${editingArticle.id}` : '/affiliate/content/articles';
            await apiRequest(path, { method: editingArticle ? 'PATCH' : 'POST', token, body: payload });
            setNotice(editingArticle ? 'Artikel diperbarui dan menunggu review admin.' : 'Artikel dibuat dan menunggu review admin.');
            resetForm();
            await loadContent();
        } catch (error) {
            setNotice(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;
    if (!user) return <p className="muted">Memuat akun...</p>;
    if (roleName(user) !== 'customer') return <NeedCustomerAccount logout={logout} />;

    return (
        <section className="content-manager">
            <div className="section-head">
                <div>
                    <p className="eyebrow">Affiliate Content</p>
                    <h1>Content creator dashboard</h1>
                </div>
                <button className="btn ghost" onClick={() => navigate('affiliate-dashboard')}>Affiliate overview</button>
            </div>

            {summary && (
                <div className="stats">
                    <Stat label="My Articles" value={summary.total_articles} />
                    <Stat label="Published" value={summary.published_articles} />
                    <Stat label="Pending" value={summary.pending_articles} />
                    <Stat label="Article Views" value={summary.article_views} />
                    <Stat label="Product Clicks" value={summary.product_clicks} />
                    <Stat label="Estimated Commission" value={formatPrice(summary.estimated_commission)} />
                </div>
            )}

            <div className="manager-layout content-editor-layout">
                <form className="panel form-grid" onSubmit={saveArticle}>
                    <div className="section-head">
                        <div>
                            <p className="eyebrow">{editingArticle ? 'Edit Article' : 'Create Article'}</p>
                            <h2>{editingArticle ? editingArticle.title : 'Artikel baru'}</h2>
                        </div>
                        {editingArticle && <button type="button" className="btn ghost compact-btn" onClick={resetForm}>Batal</button>}
                    </div>
                    <label>
                        <span>Kategori</span>
                        <select value={form.article_category_id} onChange={(event) => update('article_category_id', event.target.value)} required>
                            <option value="">Pilih kategori</option>
                            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>
                    </label>
                    <TextInput label="Title" value={form.title} onChange={(value) => update('title', value)} />
                    <TextInput label="Featured image URL" value={form.featured_image} onChange={(value) => update('featured_image', value)} required={false} />
                    <TextArea label="Excerpt" value={form.excerpt} onChange={(value) => update('excerpt', value)} />
                    <label>
                        <span>Content</span>
                        <textarea value={form.content} onChange={(event) => update('content', event.target.value)} rows="12" required />
                    </label>
                    <div className="grid-2">
                        <TextInput label="Meta title" value={form.meta_title} onChange={(value) => update('meta_title', value)} required={false} />
                        <TextInput label="Meta description" value={form.meta_description} onChange={(value) => update('meta_description', value)} required={false} />
                    </div>
                    <label>
                        <span>Status</span>
                        <select value={form.status} onChange={(event) => update('status', event.target.value)}>
                            <option value="pending">Submit for review</option>
                            <option value="draft">Draft</option>
                        </select>
                    </label>

                    <div className="recommendation-picker">
                        <span>Produk rekomendasi marketplace</span>
                        <div className="product-choice-grid">
                            {products.slice(0, 12).map((product) => (
                                <label className="choice-card" key={product.id}>
                                    <input type="checkbox" checked={selectedProductIds.includes(String(product.id))} onChange={() => toggleProduct(product.id)} />
                                    <span>{product.name}</span>
                                    <small>{formatPrice(product.price)}</small>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="external-product-box">
                        <h3>External affiliate product</h3>
                        <div className="grid-2">
                            <TextInput label="Nama produk" value={form.external_title} onChange={(value) => update('external_title', value)} required={false} />
                            <TextInput label="Platform" value={form.external_platform} onChange={(value) => update('external_platform', value)} required={false} />
                        </div>
                        <TextInput label="Affiliate URL" value={form.external_url} onChange={(value) => update('external_url', value)} required={false} />
                        <TextInput label="Label harga" value={form.external_price_label} onChange={(value) => update('external_price_label', value)} required={false} />
                    </div>

                    <button className="btn primary wide" disabled={saving}>{saving ? 'Menyimpan...' : editingArticle ? 'Update Article' : 'Create Article'}</button>
                </form>

                <div className="stack">
                    <div className="section-head">
                        <div>
                            <p className="eyebrow">My Articles</p>
                            <h2>Article Status</h2>
                        </div>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Artikel</th><th>Status</th><th>Views</th><th>Clicks</th><th>Aksi</th></tr></thead>
                            <tbody>
                                {articles.map((article) => (
                                    <tr key={article.id}>
                                        <td>
                                            <strong>{article.title}</strong>
                                            <p className="muted">{article.category?.name}</p>
                                        </td>
                                        <td>{article.status}</td>
                                        <td>{article.views_count || 0}</td>
                                        <td>{article.clicks_count || 0}</td>
                                        <td>
                                            <div className="actions">
                                                <button className="btn ghost compact-btn" onClick={() => editArticle(article)}>Edit</button>
                                                {article.status === 'published' && <button className="btn ghost compact-btn" onClick={() => navigate('blog-detail', article.slug)}>View</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {articles.length === 0 && <tr><td colSpan="5">Belum ada artikel.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}
