import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import ProductForm from '../../components/product/ProductForm.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice } from '../../utils/format.js';

export default function SellerProducts({ token, navigate, setNotice }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editing, setEditing] = useState(null);
    const [formError, setFormError] = useState('');

    useEffect(() => {
        apiRequest('/categories').then((data) => setCategories(data.data));
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
            setNotice(productId ? 'Produk diperbarui.' : 'Produk dibuat.');
            loadProducts();
        } catch (error) {
            setFormError(error.message);
            setNotice(error.message);
        }
    }

    async function deleteProduct(product) {
        const confirmed = window.confirm(`Hapus produk "${product.name}"? Produk akan hilang dari katalog dan tidak bisa dibeli lagi.`);

        if (!confirmed) return;

        try {
            await apiRequest(`/seller/products/${product.id}`, { method: 'DELETE', token });
            setNotice(`Produk "${product.name}" berhasil dihapus dari katalog.`);
            loadProducts();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section className="manager-layout">
            <div>
                <p className="eyebrow">Produk seller</p>
                <h1>Manajemen produk</h1>
                <ProductForm categories={categories} product={editing} onSubmit={saveProduct} feedback={formError} />
            </div>
            <div className="stack">
                {products.map((product) => (
                    <div className="line-item" key={product.id}>
                        <ProductImage product={product} small />
                        <div>
                            <strong>{product.name}</strong>
                            <p className="muted">{formatPrice(product.price)} - stock {product.stock} - {product.status}</p>
                        </div>
                        <button className="btn ghost" onClick={() => { setFormError(''); setEditing(product); }}>Edit</button>
                        <button className="btn danger" onClick={() => deleteProduct(product)}>Hapus produk</button>
                    </div>
                ))}
            </div>
        </section>
    );
}
