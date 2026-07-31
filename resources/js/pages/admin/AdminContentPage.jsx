import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Dropdown from '../../components/admin/Dropdown.jsx';
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
    const [showCategoryModal, setShowCategoryModal] = useState(false);
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
            setShowCategoryModal(false);
            setNotice('Categories konten dibuat.');
            loadContent();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-content" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageHeader 
                title="Content Management" 
                description="Kelola publikasi artikel blog, status approval, dan kategori tulisan."
            >
                <button onClick={() => setShowCategoryModal(true)} className="text-sm font-semibold px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors">
                    Manage Categories
                </button>
            </PageHeader>

            {/* Modal Categories */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)} />
                    <div className="relative w-full max-w-2xl bg-white border border-gray-200 rounded-2xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-black">Manage Kategori Artikel</h2>
                            <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-black">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <form className="space-y-4" onSubmit={createCategory}>
                                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Tambah Kategori Baru</h3>
                                <TextInput label="Nama kategori" value={categoryForm.name} onChange={(value) => setCategoryForm({ ...categoryForm, name: value })} />
                                <TextArea label="Deskripsi" value={categoryForm.description} onChange={(value) => setCategoryForm({ ...categoryForm, description: value })} />
                                <button className="w-full text-sm font-bold py-2.5 px-4 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors">
                                    Tambah Kategori
                                </button>
                            </form>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 mb-4">Kategori Tersedia</h3>
                                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
                                    {categories.map((category) => (
                                        <div className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:border-gray-300 transition-colors" key={category.id}>
                                            <span className="font-semibold text-sm text-black">{category.name}</span>
                                            <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{category.articles_count || 0} art</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setStatus('')} 
                        className={`text-[11px] font-semibold px-3 py-1 rounded-md transition-colors ${status === '' ? 'bg-black text-white' : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                        Semua
                    </button>
                    <button 
                        onClick={() => setStatus('pending')} 
                        className={`text-[11px] font-semibold px-3 py-1 rounded-md transition-colors ${status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'border border-gray-200 bg-white text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200'}`}
                    >
                        Pending
                    </button>
                </div>
                <Dropdown 
                    value={status} 
                    onChange={setStatus}
                    options={[{ value: '', label: 'Filter Status...' }, ...ARTICLE_STATUSES.map((item) => ({ value: item, label: item }))]}
                    ariaLabel="Filter status"
                />
            </div>

            {editingArticle && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-black">Edit Artikel: {editingArticle.title}</h2>
                        <button type="button" className="text-sm font-semibold text-gray-500 hover:text-black" onClick={() => setEditingArticle(null)}>Tutup</button>
                    </div>
                    <form className="p-6 space-y-6" onSubmit={saveArticle}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Kategori</label>
                                    <Dropdown 
                                        fullWidth
                                        value={form.article_category_id} 
                                        onChange={(value) => update('article_category_id', value)}
                                        options={[{ value: '', label: 'Pilih Kategori...' }, ...categories.map((category) => ({ value: category.id, label: category.name }))]}
                                        ariaLabel="Kategori"
                                    />
                                </div>
                                <TextInput label="Judul Artikel" value={form.title} onChange={(value) => update('title', value)} />
                                <TextArea label="Excerpt (Ringkasan)" value={form.excerpt} onChange={(value) => update('excerpt', value)} />
                                <TextInput label="Featured image URL" value={form.featured_image} onChange={(value) => update('featured_image', value)} required={false} />
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <TextInput label="Meta title" value={form.meta_title} onChange={(value) => update('meta_title', value)} required={false} />
                                    <TextInput label="Meta description" value={form.meta_description} onChange={(value) => update('meta_description', value)} required={false} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Status</label>
                                        <Dropdown 
                                            fullWidth
                                            value={form.status} 
                                            onChange={(value) => update('status', value)}
                                            options={ARTICLE_STATUSES.map((item) => ({ value: item, label: item }))}
                                            ariaLabel="Status"
                                        />
                                    </div>
                                    <TextInput label="Featured rank (0=default)" type="number" value={form.featured_rank} onChange={(value) => update('featured_rank', value)} required={false} />
                                </div>
                                <div className="flex items-center gap-3 pt-6">
                                    <input 
                                        type="checkbox" 
                                        id="is_featured"
                                        className="w-5 h-5 text-black border-gray-300 rounded focus:ring-black"
                                        checked={form.is_featured} 
                                        onChange={(event) => update('is_featured', event.target.checked)} 
                                    />
                                    <label htmlFor="is_featured" className="text-sm font-semibold text-gray-900 cursor-pointer">Tandai sebagai Featured Content</label>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Content HTML / Markdown</label>
                            <textarea 
                                rows="12" 
                                value={form.content} 
                                onChange={(event) => update('content', event.target.value)} 
                                required 
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black font-mono leading-relaxed"
                            />
                        </div>
                        <div className="flex justify-end pt-4 border-t border-gray-100">
                            <button className="text-sm font-bold py-2.5 px-6 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors">
                                Simpan Perubahan Artikel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                                <th className="px-6 py-4">Artikel</th>
                                <th className="px-6 py-4">Author</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Stats (V/C)</th>
                                <th className="px-6 py-4">Featured</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {articles.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                                        Belum ada artikel.
                                    </td>
                                </tr>
                            ) : (
                                articles.map((article) => (
                                    <tr key={article.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="block font-bold text-black text-sm">{article.title}</span>
                                            <span className="block text-xs text-gray-500 mt-0.5">{article.category?.name || 'Uncategorized'}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                                            {article.author?.creator_profile?.display_name || article.author?.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                                                article.status === 'published' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                article.status === 'pending' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                                                article.status === 'rejected' ? 'bg-red-50 text-red-800 border border-red-200' :
                                                'bg-gray-100 text-gray-700 border border-gray-200'
                                            }`}>
                                                {article.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-600">
                                            {article.views_count || 0} / {article.clicks_count || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors ${
                                                    article.is_featured ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                                                }`} 
                                                onClick={() => toggleFeatured(article)}
                                            >
                                                {article.is_featured ? '★ Featured' : 'Normal'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex gap-2 items-center">
                                                <button className="text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors" onClick={() => editArticle(article)}>Edit</button>
                                                {article.status === 'pending' && (
                                                    <>
                                                        <button className="text-xs font-semibold px-3 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors" onClick={() => approveArticle(article)}>Approve</button>
                                                        <button className="text-xs font-semibold px-3 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors" onClick={() => rejectArticle(article)}>Reject</button>
                                                    </>
                                                )}
                                                {article.status === 'published' && (
                                                    <button className="text-xs font-semibold px-3 py-1.5 border border-yellow-200 text-yellow-700 rounded-md hover:bg-yellow-50 transition-colors" onClick={() => update('status', 'draft') /* Simplified UI action */}>Draft</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
