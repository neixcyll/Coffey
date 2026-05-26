import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import { PRODUCT_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminProductsPage({ token, navigate, setNotice }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [filters, setFilters] = useState({ status: '', category_id: '', seller_id: '' });

    useEffect(() => {
        if (!token) return;
        apiRequest('/admin/categories', { token }).then((response) => setCategories(rowsFrom(response))).catch(() => {});
        apiRequest('/admin/sellers', { token }).then((response) => setSellers(rowsFrom(response))).catch(() => {});
    }, [token]);

    useEffect(() => {
        if (!token) return;
        loadProducts();
    }, [token, filters.status, filters.category_id, filters.seller_id]);

    async function loadProducts() {
        const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
        const response = await apiRequest(`/admin/products?${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setProducts(rowsFrom(response));
    }

    async function updateProductStatus(product, status) {
        try {
            await apiRequest(`/admin/products/${product.id}/status`, { method: 'PATCH', token, body: { status } });
            setNotice('Status produk diperbarui.');
            loadProducts();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-products" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Product monitoring" />
            <div className="filters compact">
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                    <option value="">Semua status</option>
                    {PRODUCT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <select value={filters.category_id} onChange={(event) => setFilters({ ...filters, category_id: event.target.value })}>
                    <option value="">Semua kategori</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <select value={filters.seller_id} onChange={(event) => setFilters({ ...filters, seller_id: event.target.value })}>
                    <option value="">Semua seller</option>
                    {sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.store_name}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Produk</th><th>Seller</th><th>Kategori</th><th>Harga</th><th>Stock</th><th>Status</th></tr></thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>{product.seller?.store_name}</td>
                                <td>{product.category?.name}</td>
                                <td>{formatPrice(product.price)}</td>
                                <td>{product.stock}</td>
                                <td>
                                    <select value={product.status} onChange={(event) => updateProductStatus(product, event.target.value)}>
                                        {PRODUCT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
