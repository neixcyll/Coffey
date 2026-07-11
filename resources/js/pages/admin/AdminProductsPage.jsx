import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminProductsPage({ token, navigate, setNotice, user, logout, notice }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [filters, setFilters] = useState({ category_id: '', seller_id: '' });

    useEffect(() => {
        if (!token) return;
        apiRequest('/admin/categories', { token }).then((response) => setCategories(rowsFrom(response))).catch(() => {});
        apiRequest('/admin/sellers', { token }).then((response) => setSellers(rowsFrom(response))).catch(() => {});
    }, [token]);

    useEffect(() => {
        if (!token) return;
        loadProducts();
    }, [token, filters.category_id, filters.seller_id]);

    async function loadProducts() {
        const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
        const response = await apiRequest(`/admin/products?${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setProducts(rowsFrom(response));
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-products" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageTitle eyebrow="Admin" title="Product monitoring" />
            <div className="filters compact">
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
                    <thead><tr><th>Products</th><th>Seller</th><th>Categories</th><th>Harga</th><th>Stock</th><th>Variant</th></tr></thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>{product.seller?.store_name}</td>
                                <td>{product.category?.name}</td>
                                <td>{priceLabel(product)}</td>
                                <td>{product.stock}</td>
                                <td>{product.variants?.length || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function priceLabel(product) {
    const min = Number(product.min_price ?? product.price ?? 0);
    const max = Number(product.max_price ?? product.price ?? min);

    return max > min ? `${formatPrice(min)} - ${formatPrice(max)}` : formatPrice(min);
}
