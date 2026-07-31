import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Dropdown from '../../components/admin/Dropdown.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminProductsPage({ token, navigate, setNotice, user, logout, notice }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [filters, setFilters] = useState({ category_id: '', seller_id: '' });
    const [search, setSearch] = useState('');

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

    const filteredProducts = products.filter(p => 
        p.name?.toLowerCase().includes(search.toLowerCase()) || 
        p.seller?.store_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout current="admin-products" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageHeader 
                title="Product Monitoring" 
                description="Pantau kualitas produk, ketersediaan stok, varian, dan sebaran kategori seluruh produk seller."
            />

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="    Cari produk berdasarkan nama atau seller..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Dropdown
                        value={filters.category_id}
                        onChange={(value) => setFilters({ ...filters, category_id: value })}
                        options={[{ value: '', label: 'Semua Kategori' }, ...categories.map((category) => ({ value: category.id, label: category.name }))]}
                        ariaLabel="Filter kategori"
                    />
                    <Dropdown
                        value={filters.seller_id}
                        onChange={(value) => setFilters({ ...filters, seller_id: value })}
                        options={[{ value: '', label: 'Semua Seller' }, ...sellers.map((seller) => ({ value: seller.id, label: seller.store_name }))]}
                        ariaLabel="Filter seller"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                <th className="px-6 py-4">Produk</th>
                                <th className="px-6 py-4">Seller</th>
                                <th className="px-6 py-4">Kategori</th>
                                <th className="px-6 py-4">Harga</th>
                                <th className="px-6 py-4">Stok</th>
                                <th className="px-6 py-4">Varian</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                                        Tidak menemukan data produk.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-black text-sm">{product.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-semibold text-black">{product.seller?.store_name || '-'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-black border border-gray-200">
                                                {product.category?.name || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-semibold text-black">{priceLabel(product)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-sm font-medium ${product.stock < 10 ? 'text-red-600 font-semibold' : 'text-black'}`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{product.variants?.length || 0}</td>
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

function priceLabel(product) {
    const min = Number(product.min_price ?? product.price ?? 0);
    const max = Number(product.max_price ?? product.price ?? min);

    return max > min ? `${formatPrice(min)} - ${formatPrice(max)}` : formatPrice(min);
}
