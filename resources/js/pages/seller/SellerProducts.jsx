import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import ProductForm from '../../components/product/ProductForm.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, formatWeight } from '../../utils/format.js';

export default function SellerProducts({ token, navigate, setNotice }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brewingMethods, setBrewingMethods] = useState([]);
    const [editing, setEditing] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        apiRequest('/categories').then((data) => setCategories(data.data));
        apiRequest('/brewing-methods').then((data) => setBrewingMethods(data.data));
        if (token) loadProducts();
    }, [token]);

    async function loadProducts() {
        const data = await apiRequest('/seller/products', { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setProducts(data.data || []);
    }

    async function saveProduct(formData, productId) {
        setFormError('');

        try {
            await apiRequest(productId ? `/seller/products/${productId}` : '/seller/products', {
                method: 'POST',
                token,
                body: formData,
                isForm: true,
            });
            setEditing(null);
            setFormOpen(false);
            setNotice(productId ? 'Products diperbarui.' : 'Products dibuat.');
            loadProducts();
        } catch (error) {
            setFormError(error.message);
            setNotice(error.message);
        }
    }

    async function deleteProduct() {
        if (!deleting) return;

        try {
            await apiRequest(`/seller/products/${deleting.id}`, { method: 'DELETE', token });
            setNotice(`Products "${deleting.name}" berhasil dihapus dari katalog.`);
            setDeleting(null);
            loadProducts();
        } catch (error) {
            setNotice(error.message);
        }
    }

    function openCreateForm() {
        setEditing(null);
        setFormError('');
        setFormOpen(true);
    }

    function openEditForm(product) {
        setEditing(product);
        setFormError('');
        setFormOpen(true);
    }

    function closeForm() {
        setEditing(null);
        setFormError('');
        setFormOpen(false);
    }

    if (!token) return <NeedLogin navigate={navigate} />;
    if (formOpen) {
        return (
            <section className="seller-products-page">
                <div className="section-head">
                    <div>
                        <p className="eyebrow">Products seller</p>
                        <h1>{editing ? 'Edit produk' : 'Add produk'}</h1>
                    </div>
                    <button className="btn ghost" onClick={closeForm}>Kembali ke daftar</button>
                </div>
                <div className="product-form-shell">
                    <ProductForm
                        categories={categories}
                        brewingMethods={brewingMethods}
                        product={editing}
                        onSubmit={saveProduct}
                        feedback={formError}
                    />
                </div>
            </section>
        );
    }

    return (
        <section className="seller-products-page">
            <div className="section-head">
                <div>
                    <p className="eyebrow">Products seller</p>
                    <h1>Manajemen produk</h1>
                </div>
                <button className="btn primary" onClick={openCreateForm}>Add produk</button>
            </div>
            <div className="stack seller-product-list">
                {products.map((product) => (
                    <div className="line-item" key={product.id}>
                        <ProductImage product={product} small />
                        <div>
                            <strong>{product.name}</strong>
                            <p className="muted">{priceLabel(product)} - stock {product.stock} - {product.variants?.length || 0} variant</p>
                            <div className="tag-row">
                                {(product.brewing_methods || []).map((method) => <span className="badge" key={method.id}>{method.name}</span>)}
                                {(product.variants || []).slice(0, 3).map((variant) => (
                                    <span className="badge" key={variant.id}>{formatWeight(variant.weight_grams)} / {variant.grind_size}</span>
                                ))}
                            </div>
                        </div>
                        <button className="btn ghost" onClick={() => openEditForm(product)}>Edit</button>
                        <button className="btn danger" onClick={() => setDeleting(product)}>Delete produk</button>
                    </div>
                ))}
                {products.length === 0 && (
                    <div className="panel empty-state">
                        <p className="muted">Belum ada produk.</p>
                        <button className="btn primary" onClick={openCreateForm}>Add produk</button>
                    </div>
                )}
            </div>
            {deleting && (
                <div className="modal-backdrop" role="presentation" onClick={() => setDeleting(null)}>
                    <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="delete-product-title" onClick={(event) => event.stopPropagation()}>
                        <h2 id="delete-product-title">Delete Products?</h2>
                        <p className="muted">Products yang dihapus tidak dapat dikembalikan.</p>
                        <div className="row end">
                            <button className="btn ghost" onClick={() => setDeleting(null)}>Cancel</button>
                            <button className="btn danger" onClick={deleteProduct}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

function priceLabel(product) {
    const min = Number(product.min_price ?? product.price ?? 0);
    const max = Number(product.max_price ?? product.price ?? min);

    if (max > min) {
        return `${formatPrice(min)} - ${formatPrice(max)}`;
    }

    return formatPrice(min);
}
