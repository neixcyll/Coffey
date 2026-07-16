import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import TextArea from '../../components/common/TextArea.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { apiRequest } from '../../services/api.js';
import { rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminCategoriesPage({ token, navigate, setNotice, user, logout, notice }) {
    const [categories, setCategories] = useState([]);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });
    const [deletingCategoryItem, setDeletingCategoryItem] = useState(null);

    useEffect(() => {
        if (!token) return;
        loadCategories();
    }, [token]);

    function editCategory(category) {
        setEditing(category);
        setForm({ name: category.name, description: category.description || '' });
        setShowForm(true);
    }

    async function loadCategories() {
        const response = await apiRequest('/admin/categories', { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setCategories(rowsFrom(response));
    }

    async function saveCategory(event) {
        event.preventDefault();
        const path = editing ? `/admin/categories/${editing.id}` : '/admin/categories';
        const method = editing ? 'PUT' : 'POST';

        try {
            await apiRequest(path, { method, token, body: form });
            setNotice(editing ? 'Categories diperbarui.' : 'Categories dibuat.');
            setEditing(null);
            setShowForm(false);
            setForm({ name: '', description: '' });
            loadCategories();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function deleteCategory(category) {
        await apiRequest(`/admin/categories/${category.id}`, { method: 'DELETE', token })
            .then(() => {
                setNotice('Categories dihapus.');
                loadCategories();
            })
            .catch((error) => setNotice(error.message));
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-categories" navigate={navigate} user={user} logout={logout} notice={notice}>
            {deletingCategoryItem && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setDeletingCategoryItem(null)} />
                    <div className="relative bg-white p-8 rounded-2xl border border-gray-200 shadow-2xl max-w-sm w-full text-center">
                        <h3 className="text-xl font-bold text-black mb-2">Konfirmasi Hapus</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Apakah Anda yakin menghapus kategori <strong>{deletingCategoryItem.name}</strong>?
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button 
                                type="button" 
                                className="text-sm font-semibold px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                onClick={() => setDeletingCategoryItem(null)}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="text-sm font-semibold px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                                onClick={() => {
                                    deleteCategory(deletingCategoryItem);
                                    setDeletingCategoryItem(null);
                                }}
                            >
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditing(null); setForm({ name: '', description: '' }); }} />
                    <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-black">
                                {editing ? 'Edit Kategori' : 'Tambah Kategori'}
                            </h2>
                            <button onClick={() => { setShowForm(false); setEditing(null); setForm({ name: '', description: '' }); }} className="text-gray-400 hover:text-black">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <form className="space-y-6" onSubmit={saveCategory}>
                            <TextInput label="Nama kategori" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                            <TextArea label="Deskripsi" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
                            <div className="flex gap-3 mt-8">
                                <button className="flex-1 text-sm font-bold py-3 px-6 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors">
                                    {editing ? 'Simpan Perubahan' : 'Tambah Kategori'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <PageHeader 
                title="Category Management" 
                description="Kelola kategori produk marketplace agar navigasi katalog tetap rapi."
            >
                <button 
                    onClick={() => setShowForm(true)}
                    className="text-sm font-semibold px-6 py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                >
                    Tambah Kategori
                </button>
            </PageHeader>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                                <th className="px-8 py-5">Nama</th>
                                <th className="px-8 py-5">Slug</th>
                                <th className="px-8 py-5">Produk</th>
                                <th className="px-8 py-5 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {categories.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-8 py-16 text-center text-sm text-gray-500">
                                        Belum ada kategori yang dibuat.
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <span className="block font-bold text-black text-base">{category.name}</span>
                                            {category.description && <span className="block text-sm text-gray-500 mt-1">{category.description}</span>}
                                        </td>
                                        <td className="px-8 py-6 text-sm text-gray-500 font-mono tracking-tight">{category.slug}</td>
                                        <td className="px-8 py-6 text-base font-bold text-black">{category.products_count}</td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="inline-flex gap-3">
                                                <button onClick={() => editCategory(category)} className="text-sm font-semibold px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    Edit
                                                </button>
                                                <button onClick={() => setDeletingCategoryItem(category)} className="text-sm font-semibold px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                                                    Delete
                                                </button>
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
