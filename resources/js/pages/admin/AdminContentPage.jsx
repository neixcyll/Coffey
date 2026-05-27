import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import TextArea from '../../components/common/TextArea.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { ARTICLE_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminContentPage({ token, navigate, setNotice, user, logout, notice }) {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [status, setStatus] = useState('');
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
    const [editingArticle, setEditingArticle] = useState(null);
    const [form, setForm] = useState({
        article_category_id: '',
        title: '',
        excerpt: '',
        content: '',
        featured_image: '',
        meta_title: '',
        meta_description: '',
        status: 'pending',
        is_featured: false,
        featured_rank: 0,
    });

    useEffect(() => {
        if (!token) return;
        loadContent();
    }, [token, status]);

    async function loadContent() {
        const query = status ? `?status=${status}` : '';
        try {
            const [articleResponse, categoryResponse] = await Promise.all([
                apiRequest(`/admin/content/articles${query}`, { token }),
                apiRequest('/admin/content/categories', { token }),
            ]);
            setArticles(rowsFrom(articleResponse));
            setCategories(categoryResponse.data || []);
        } catch (error) {
            setNotice(error.message);
        }
    }

    function editArticle(article) {
        setEditingArticle(article);
        setForm({
            article_category_id: article.category?.id || '',
            title: article.title || '',
            excerpt: article.excerpt || '',
            content: article.content || '',
            featured_image: article.featured_image || article.featured_image_url || '',
            meta_title: article.meta_title || '',
            meta_description: article.meta_description || '',
            status: article.status || 'pending',
            is_featured: Boolean(article.is_featured),
            featured_rank: article.featured_rank || 0,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    async function saveArticle(event) {
        event.preventDefault();
        if (!editingArticle) return;

        try {
            await apiRequest(`/admin/content/articles/${editingArticle.id}`, {
                method: 'PATCH',
                token,
                body: {
                    ...form,
                    article_category_id: Number(form.article_category_id),
                    featured_rank: Number(form.featured_rank || 0),
                },
            });
            setNotice('Artikel diperbarui.');
            setEditingArticle(null);
            await loadContent();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function approveArticle(article) {
        try {
            await apiRequest(`/admin/content/articles/${article.id}/approve`, { method: 'POST', token });
            setNotice('Artikel dipublish.');
            loadContent();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function rejectArticle(article) {
        const reason = window.prompt('Alasan reject artikel:', article.rejection_reason || '');
        if (reason === null) return;

        try {
            await apiRequest(`/admin/content/articles/${article.id}/reject`, { method: 'POST', token, body: { rejection_reason: reason } });
            setNotice('Artikel ditolak.');
            loadContent();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function toggleFeatured(article) {
        try {
            await apiRequest(`/admin/content/articles/${article.id}`, {
                method: 'PATCH',
                token,
                body: {
                    is_featured: !article.is_featured,
                    featured_rank: article.featured_rank || 0,
                },
            });
            setNotice('Featured content diperbarui.');
            loadContent();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function createCategory(event) {
        event.preventDefault();
        try {
            await apiRequest('/admin/content/categories', { method: 'POST', token, body: categoryForm });
            setCategoryForm({ name: '', description: '' });
            setNotice('Kategori konten dibuat.');
            loadContent();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-content" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageTitle eyebrow="Admin" title="Content Management" />
            <div className="filters compact">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">All Articles</option>
                    {ARTICLE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <button className="btn ghost" onClick={() => setStatus('pending')}>Pending Articles</button>
            </div>

            {editingArticle && (
                <form className="panel form-grid" onSubmit={saveArticle}>
                    <div className="section-head">
                        <div>
                            <p className="eyebrow">Edit Article</p>
                            <h2>{editingArticle.title}</h2>
                        </div>
                        <button type="button" className="btn ghost compact-btn" onClick={() => setEditingArticle(null)}>Tutup</button>
                    </div>
                    <label>
                        <span>Kategori</span>
                        <select value={form.article_category_id} onChange={(event) => update('article_category_id', event.target.value)} required>
                            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>
                    </label>
                    <TextInput label="Title" value={form.title} onChange={(value) => update('title', value)} />
                    <TextInput label="Featured image URL" value={form.featured_image} onChange={(value) => update('featured_image', value)} required={false} />
                    <TextArea label="Excerpt" value={form.excerpt} onChange={(value) => update('excerpt', value)} />
                    <label>
                        <span>Content</span>
                        <textarea rows="10" value={form.content} onChange={(event) => update('content', event.target.value)} required />
                    </label>
                    <div className="grid-2">
                        <TextInput label="Meta title" value={form.meta_title} onChange={(value) => update('meta_title', value)} required={false} />
                        <TextInput label="Meta description" value={form.meta_description} onChange={(value) => update('meta_description', value)} required={false} />
                    </div>
                    <div className="grid-2">
                        <label>
                            <span>Status</span>
                            <select value={form.status} onChange={(event) => update('status', event.target.value)}>
                                {ARTICLE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </label>
                        <TextInput label="Featured rank" type="number" value={form.featured_rank} onChange={(value) => update('featured_rank', value)} required={false} />
                    </div>
                    <label className="inline-check">
                        <input type="checkbox" checked={form.is_featured} onChange={(event) => update('is_featured', event.target.checked)} />
                        <span>Featured content</span>
                    </label>
                    <button className="btn primary">Simpan artikel</button>
                </form>
            )}

            <div className="table-wrap">
                <table>
                    <thead><tr><th>Artikel</th><th>Author</th><th>Status</th><th>Views</th><th>Clicks</th><th>Featured</th><th>Aksi</th></tr></thead>
                    <tbody>
                        {articles.map((article) => (
                            <tr key={article.id}>
                                <td>
                                    <strong>{article.title}</strong>
                                    <p className="muted">{article.category?.name}</p>
                                </td>
                                <td>{article.author?.creator_profile?.display_name || article.author?.name}</td>
                                <td>{article.status}</td>
                                <td>{article.views_count || 0}</td>
                                <td>{article.clicks_count || 0}</td>
                                <td>
                                    <button className="btn ghost compact-btn" onClick={() => toggleFeatured(article)}>
                                        {article.is_featured ? 'Featured' : 'Normal'}
                                    </button>
                                </td>
                                <td>
                                    <div className="actions">
                                        <button className="btn ghost compact-btn" onClick={() => editArticle(article)}>Edit</button>
                                        <button className="btn primary compact-btn" onClick={() => approveArticle(article)}>Approve</button>
                                        <button className="btn danger compact-btn" onClick={() => rejectArticle(article)}>Reject</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {articles.length === 0 && <tr><td colSpan="7">Belum ada artikel.</td></tr>}
                    </tbody>
                </table>
            </div>

            <div className="admin-split">
                <form className="panel form-grid" onSubmit={createCategory}>
                    <div>
                        <p className="eyebrow">Manage Categories</p>
                        <h2>Kategori artikel</h2>
                    </div>
                    <TextInput label="Nama kategori" value={categoryForm.name} onChange={(value) => setCategoryForm({ ...categoryForm, name: value })} />
                    <TextArea label="Deskripsi" value={categoryForm.description} onChange={(value) => setCategoryForm({ ...categoryForm, description: value })} />
                    <button className="btn primary">Tambah kategori</button>
                </form>
                <div className="panel">
                    <p className="eyebrow">Existing</p>
                    <h2>Content categories</h2>
                    <div className="category-list">
                        {categories.map((category) => (
                            <div className="category-row" key={category.id}>
                                <span>{category.name}</span>
                                <small>{category.articles_count || 0} artikel</small>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
