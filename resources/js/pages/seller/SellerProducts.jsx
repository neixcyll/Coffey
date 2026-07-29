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
            <section className="p-6 md:p-8 max-w-7xl mx-auto w-full">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase mb-1">Products Seller</p>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">{editing ? 'Edit Produk' : 'Tambah Produk Baru'}</h1>
                    </div>
                    <button 
                        className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm self-start sm:self-auto" 
                        onClick={closeForm}
                    >
                        Kembali ke Daftar
                    </button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
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
        <section className="p-6 md:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase mb-1">Products Seller</p>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight">Manajemen Produk</h1>
                </div>
                <button 
                    className="px-6 py-2.5 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors shadow-sm self-start sm:self-auto" 
                    onClick={openCreateForm}
                >
                    + Tambah Produk
                </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                                <th className="px-6 py-4 font-semibold w-24 text-center">Foto</th>
                                <th className="px-6 py-4 font-semibold">Nama Produk</th>
                                <th className="px-6 py-4 font-semibold">Harga & Stok</th>
                                <th className="px-6 py-4 font-semibold">Kategori / Variant</th>
                                <th className="px-6 py-4 font-semibold text-center w-48"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4 align-middle">
                                        <div className="relative w-[72px] h-[72px] rounded-xl bg-gray-100 border border-gray-200 overflow-hidden mx-auto">
                                            <ProductImage product={product} small />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <strong className="block text-gray-900 font-bold text-base">{product.name}</strong>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <strong className="block text-gray-900 font-bold mb-1">{priceLabel(product)}</strong>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-600">
                                            Stok: {product.stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 align-middle">
                                        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black text-white">
                                                {product.category?.name || 'Kopi'}
                                            </span>
                                            {(product.variants || []).slice(0, 2).map((variant) => (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200" key={variant.id}>
                                                    {formatWeight(variant.weight_grams)} - {variant.grind_size}
                                                </span>
                                            ))}
                                            {(product.variants?.length > 2) && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                    +{product.variants.length - 2} lagi
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 align-middle text-center w-48">
                                        <div className="flex items-center justify-center gap-2">
                                            <button 
                                                className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-[76px] text-center"
                                                onClick={() => openEditForm(product)}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors w-[76px] text-center"
                                                onClick={() => setDeleting(product)}
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {products.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-gray-500">
                                            <BoxIconLarge />
                                            <p className="mt-4 text-base font-semibold">Belum ada produk</p>
                                            <p className="text-sm mt-1 mb-6">Mulai tambahkan produk pertama Anda ke katalog.</p>
                                            <button className="px-6 py-2.5 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors shadow-sm" onClick={openCreateForm}>
                                                + Tambah Produk
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {deleting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="presentation" onClick={() => setDeleting(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200" role="dialog" aria-modal="true" aria-labelledby="delete-product-title" onClick={(event) => event.stopPropagation()}>
                        <h2 id="delete-product-title" className="text-xl font-bold text-gray-900 mb-2">Hapus Produk?</h2>
                        <p className="text-gray-500 text-sm mb-6">Anda yakin ingin menghapus <strong>"{deleting.name}"</strong> dari katalog? Tindakan ini tidak dapat dibatalkan.</p>
                        <div className="flex items-center justify-end gap-3">
                            <button className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => setDeleting(null)}>Batal</button>
                            <button className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm transition-colors" onClick={deleteProduct}>Ya, Hapus</button>
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

function BoxIconLarge() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
            <path d="M21 8l-9-5-9 5 9 5 9-5Z" />
            <path d="M3 8v8l9 5 9-5V8" />
            <path d="M12 13v8" />
        </svg>
    );
}
