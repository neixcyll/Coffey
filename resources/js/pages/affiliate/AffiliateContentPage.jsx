import { useEffect, useMemo, useState } from 'react';
import NeedCustomerAccount from '../../components/common/NeedCustomerAccount.jsx';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import Stat from '../../components/common/Stat.jsx';
import TextArea from '../../components/common/TextArea.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import { roleName } from '../../utils/route.js';

const COVER_LIMIT_BYTES = 2 * 1024 * 1024;
const EDIT_ARTICLE_KEY = 'affiliate_edit_article_id';

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
        external_image: '',
    };
}

export default function AffiliateContentPage({
    mode = 'upload',
    embedded = false,
    token,
    user,
    navigate,
    setNotice,
    logout,
}) {
    const [summary, setSummary] = useState(null);
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(emptyArticleForm());
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [editingArticle, setEditingArticle] = useState(null);
    const [saving, setSaving] = useState(false);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState('');
    const [coverError, setCoverError] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [contentLoaded, setContentLoaded] = useState(false);

    useEffect(() => {
        if (!token) return;
        loadContent();
    }, [token]);

    useEffect(() => {
        if (mode !== 'upload' || !contentLoaded || editingArticle) return;

        const editId = sessionStorage.getItem(EDIT_ARTICLE_KEY);
        if (!editId) return;

        const article = articles.find((item) => String(item.id) === editId);
        if (!article) return;

        fillArticleForm(article);
        sessionStorage.removeItem(EDIT_ARTICLE_KEY);
    }, [articles, contentLoaded, editingArticle, mode]);

    const filteredArticles = useMemo(() => {
        if (statusFilter === 'all') return articles;
        return articles.filter((article) => article.status === statusFilter);
    }, [articles, statusFilter]);

    async function loadContent() {
        setContentLoaded(false);

        try {
            const [summaryResponse, articleResponse, categoryResponse, productResponse] = await Promise.all([
                apiRequest('/affiliate/content/summary', { token }),
                apiRequest('/affiliate/content/articles?per_page=100', { token }),
                apiRequest('/affiliate/content/categories', { token }),
                apiRequest('/products?per_page=100'),
            ]);

            setSummary(summaryResponse.data);
            setArticles(rowsFrom(articleResponse));
            setCategories(categoryResponse.data || []);
            setProducts(rowsFrom(productResponse));
        } catch (error) {
            setNotice(error.message);
        } finally {
            setContentLoaded(true);
        }
    }

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        if (field === 'featured_image') setCoverPreview(value);
    }

    function handleCoverFile(event) {
        const file = event.target.files?.[0] || null;
        setCoverError('');
        setCoverFile(null);

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setCoverError('Cover harus berupa file gambar.');
            return;
        }

        if (file.size > COVER_LIMIT_BYTES) {
            setCoverError('Ukuran cover maksimal 2MB.');
            return;
        }

        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    }

    function toggleProduct(productId) {
        setSelectedProductIds((current) => {
            const id = String(productId);
            return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
        });
    }

    function fillArticleForm(article) {
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
            external_image: external.image_url || '',
        });
        setSelectedProductIds((article.recommended_products || []).filter((item) => item.product_id).map((item) => String(item.product_id)));
        setCoverFile(null);
        setCoverPreview(article.featured_image_url || article.featured_image || '');
        setCoverError('');
    }

    function editArticle(article) {
        sessionStorage.setItem(EDIT_ARTICLE_KEY, String(article.id));
        fillArticleForm(article);
        navigate('affiliate-dashboard', 'upload');
    }

    function resetForm() {
        setEditingArticle(null);
        setForm(emptyArticleForm());
        setSelectedProductIds([]);
        setCoverFile(null);
        setCoverPreview('');
        setCoverError('');
    }

    async function saveArticle(event) {
        event.preventDefault();
        if (coverError) return;

        setSaving(true);

        try {
            const payload = buildArticlePayload(form, selectedProductIds, coverFile);
            const path = editingArticle ? `/affiliate/content/articles/${editingArticle.id}` : '/affiliate/content/articles';

            if (editingArticle) payload.append('_method', 'PATCH');

            await apiRequest(path, {
                method: 'POST',
                token,
                body: payload,
                isForm: true,
            });
            setNotice(editingArticle ? 'Konten diperbarui dan menunggu review admin.' : 'Konten dibuat dan menunggu review admin.');
            resetForm();
            await loadContent();
            navigate('affiliate-dashboard', 'content');
        } catch (error) {
            setNotice(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;
    if (!user) return <p className="muted">Memuat akun...</p>;
    if (roleName(user) !== 'customer') return <NeedCustomerAccount logout={logout} />;

    const content = mode === 'library' ? (
        <AffiliateContentLibrary
            summary={summary}
            articles={filteredArticles}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onEdit={editArticle}
            navigate={navigate}
        />
    ) : (
        <AffiliateUploadForm
            categories={categories}
            products={products}
            form={form}
            update={update}
            coverPreview={coverPreview}
            coverError={coverError}
            handleCoverFile={handleCoverFile}
            selectedProductIds={selectedProductIds}
            toggleProduct={toggleProduct}
            editingArticle={editingArticle}
            resetForm={resetForm}
            saveArticle={saveArticle}
            saving={saving}
            navigate={navigate}
        />
    );

    if (embedded) return content;

    return (
        <section className="affiliate-content-layer">
            {content}
        </section>
    );
}

function AffiliateUploadForm({
    categories,
    products,
    form,
    update,
    coverPreview,
    coverError,
    handleCoverFile,
    selectedProductIds,
    toggleProduct,
    editingArticle,
    resetForm,
    saveArticle,
    saving,
    navigate,
}) {
    return (
        <section className="affiliate-upload-section">
            <div className="section-head">
                <div>
                    <p className="eyebrow">Upload Content</p>
                    <h1>{editingArticle ? 'Edit konten affiliate' : 'Buat konten affiliate'}</h1>
                </div>
                <button className="btn ghost" type="button" onClick={() => navigate('affiliate-dashboard', 'content')}>My Content</button>
            </div>
            <form id="content-upload" className="panel form-grid content-upload-panel content-upload-page-panel" onSubmit={saveArticle}>
                <div className="section-head">
                    <div>
                        <p className="eyebrow">{editingArticle ? 'Edit Upload' : 'New Upload'}</p>
                        <h2>{editingArticle ? editingArticle.title : 'Content workspace'}</h2>
                    </div>
                    {editingArticle && <button type="button" className="btn ghost compact-btn" onClick={resetForm}>Cancel edit</button>}
                </div>

                <div className="content-upload-dropzone">
                    <div className="content-cover-preview">
                        {coverPreview ? <img src={coverPreview} alt="Preview cover content" /> : <span>Cover</span>}
                    </div>
                    <div className="form-grid">
                        <label>
                            <span>Upload cover image</span>
                            <input type="file" accept="image/*" onChange={handleCoverFile} />
                        </label>
                        <TextInput label="Atau paste cover image URL" value={form.featured_image} onChange={(value) => update('featured_image', value)} required={false} />
                        {coverError && <p className="form-alert error">{coverError}</p>}
                    </div>
                </div>

                <label>
                    <span>Kategori konten</span>
                    <select value={form.article_category_id} onChange={(event) => update('article_category_id', event.target.value)} required>
                        <option value="">Pilih kategori</option>
                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                </label>
                <TextInput label="Title" value={form.title} onChange={(value) => update('title', value)} />
                <TextArea label="Excerpt" value={form.excerpt} onChange={(value) => update('excerpt', value)} />
                <label>
                    <span>Body artikel</span>
                    <textarea value={form.content} onChange={(event) => update('content', event.target.value)} rows="12" required />
                </label>

                <div className="grid-2">
                    <TextInput label="Meta title" value={form.meta_title} onChange={(value) => update('meta_title', value)} required={false} />
                    <TextInput label="Meta description" value={form.meta_description} onChange={(value) => update('meta_description', value)} required={false} />
                </div>

                <label>
                    <span>Status</span>
                    <select value={form.status} onChange={(event) => update('status', event.target.value)}>
                        <option value="pending">Submit / Publish Review</option>
                        <option value="draft">Save as draft</option>
                    </select>
                </label>

                <div className="recommendation-picker">
                    <span>Hubungkan produk marketplace</span>
                    <div className="product-choice-grid content-product-choice-grid">
                        {products.slice(0, 16).map((product) => (
                            <label className={`choice-card ${selectedProductIds.includes(String(product.id)) ? 'selected' : ''}`} key={product.id}>
                                <input type="checkbox" checked={selectedProductIds.includes(String(product.id))} onChange={() => toggleProduct(product.id)} />
                                <span>{product.name}</span>
                                <small>{formatPrice(product.price)}</small>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="external-product-box">
                    <div>
                        <p className="eyebrow">External Affiliate Link</p>
                        <h3>Tambahkan link produk dari platform lain</h3>
                    </div>
                    <div className="grid-2">
                        <TextInput label="Nama produk" value={form.external_title} onChange={(value) => update('external_title', value)} required={false} />
                        <TextInput label="Platform" value={form.external_platform} onChange={(value) => update('external_platform', value)} required={false} />
                    </div>
                    <TextInput label="Affiliate URL" value={form.external_url} onChange={(value) => update('external_url', value)} required={false} />
                    <div className="grid-2">
                        <TextInput label="Label harga" value={form.external_price_label} onChange={(value) => update('external_price_label', value)} required={false} />
                        <TextInput label="Image URL" value={form.external_image} onChange={(value) => update('external_image', value)} required={false} />
                    </div>
                </div>

                <button className="btn primary wide" disabled={saving || Boolean(coverError)}>
                    {saving ? 'Menyimpan...' : editingArticle ? 'Update content' : 'Submit content'}
                </button>
            </form>
        </section>
    );
}

function AffiliateContentLibrary({ summary, articles, statusFilter, setStatusFilter, onEdit, navigate }) {
    return (
        <section className="affiliate-my-content-section">
            <div className="section-head">
                <div>
                    <p className="eyebrow">My Content</p>
                    <h1>Konten affiliate saya</h1>
                </div>
                <button className="btn primary" type="button" onClick={() => navigate('affiliate-dashboard', 'upload')}>Upload Content</button>
            </div>
            {summary && (
                <div className="stats">
                    <Stat label="All Uploads" value={summary.total_articles} />
                    <Stat label="Published" value={summary.published_articles} />
                    <Stat label="Pending Review" value={summary.pending_articles} />
                    <Stat label="Article Views" value={summary.article_views} />
                    <Stat label="Product Clicks" value={summary.product_clicks} />
                    <Stat label="Estimated Commission" value={formatPrice(summary.estimated_commission)} />
                </div>
            )}
            <div className="content-status-tabs" aria-label="Filter upload content">
                {['all', 'draft', 'pending', 'published', 'rejected'].map((status) => (
                    <button
                        className={statusFilter === status ? 'active' : ''}
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                    >
                        {statusLabel(status)}
                    </button>
                ))}
            </div>
            <div className="content-upload-list output-content-grid">
                {articles.map((article) => (
                    <ContentUploadCard
                        key={article.id}
                        article={article}
                        onEdit={() => onEdit(article)}
                        onView={() => navigate('blog-detail', article.slug)}
                    />
                ))}
                {articles.length === 0 && (
                    <div className="panel empty-state modern-empty-state">
                        <span className="empty-state-mark">C</span>
                        <div>
                            <p className="eyebrow">Content</p>
                            <h3>Belum ada konten pada status ini.</h3>
                            <p className="muted">Gunakan menu Upload Content untuk membuat konten affiliate.</p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

function ContentUploadCard({ article, onEdit, onView }) {
    return (
        <article className="content-upload-card">
            <div className="content-upload-thumb">
                {article.featured_image_url ? <img src={article.featured_image_url} alt={article.title} /> : <span>{article.title?.slice(0, 1) || 'C'}</span>}
            </div>
            <div className="content-upload-card-body">
                <div className="market-product-topline">
                    <span className={`content-status ${statusClass(article.status)}`}>{statusLabel(article.status)}</span>
                    <small>{article.category?.name || 'Content'}</small>
                </div>
                <h3>{article.title}</h3>
                <p className="muted">{article.excerpt || 'Belum ada excerpt.'}</p>
                <div className="content-upload-meta">
                    <span>{article.views_count || 0} views</span>
                    <span>{article.clicks_count || 0} clicks</span>
                    <span>{(article.recommended_products || []).length} products</span>
                </div>
                {article.status === 'rejected' && article.rejection_reason && (
                    <p className="form-alert error">{article.rejection_reason}</p>
                )}
                <div className="actions">
                    <button className="btn ghost compact-btn" type="button" onClick={onEdit}>Edit</button>
                    {article.status === 'published' && <button className="btn primary compact-btn" type="button" onClick={onView}>View</button>}
                </div>
            </div>
        </article>
    );
}

function buildArticlePayload(form, selectedProductIds, coverFile) {
    const payload = new FormData();
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
            external_image: form.external_image,
            sort_order: recommendations.length,
        });
    }

    [
        'article_category_id',
        'title',
        'excerpt',
        'content',
        'featured_image',
        'meta_title',
        'meta_description',
        'status',
    ].forEach((key) => {
        payload.append(key, form[key] ?? '');
    });

    recommendations.forEach((recommendation, index) => {
        Object.entries(recommendation).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                payload.append(`recommendations[${index}][${key}]`, value);
            }
        });
    });

    if (coverFile) payload.append('featured_image_file', coverFile);

    return payload;
}

function statusLabel(status) {
    const labels = {
        all: 'All',
        draft: 'Draft',
        pending: 'Pending',
        published: 'Published',
        rejected: 'Rejected',
    };

    return labels[status] || status;
}

function statusClass(status) {
    if (status === 'published') return 'published';
    if (status === 'pending') return 'pending';
    if (status === 'rejected') return 'rejected';

    return 'draft';
}
