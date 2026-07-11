import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import TextArea from '../../components/common/TextArea.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { apiRequest } from '../../services/api.js';
import { rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminCategoriesPage({ token, navigate, setNotice, user, logout, notice }) {
    const [categories, setCategories] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', description: '' });
    const [deletingCategoryItem, setDeletingCategoryItem] = useState(null);

    useEffect(() => {
        if (!token) return;
        loadCategories();
    }, [token]);

    function editCategory(category) {
        setEditing(category);
        setForm({ name: category.name, description: category.description || '' });
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
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(0,0,0,0.5)] backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xl max-w-[400px] w-full mx-4 flex flex-col gap-4 text-center">
                        <h3 className="text-lg font-bold text-gray-900">Konfirmasi Hapus</h3>
                        <p className="text-sm text-[#4d4035]">
                            Apakah Anda yakin menghapus kategori <strong>{deletingCategoryItem.name}</strong>?
                        </p>
                        <div className="flex gap-3 justify-center mt-2">
                            <button 
                                type="button" 
                                className="btn ghost border border-gray-300"
                                onClick={() => setDeletingCategoryItem(null)}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="btn danger"
                                onClick={() => {
                                    deleteCategory(deletingCategoryItem);
                                    setDeletingCategoryItem(null);
                                }}
                            >
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <PageTitle eyebrow="Admin" title="Category management" />
            <form className="panel form-grid admin-form" onSubmit={saveCategory}>
                <TextInput label="Nama kategori" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                <TextArea label="Deskripsi" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
                <button className="btn primary">{editing ? 'Save kategori' : 'Add kategori'}</button>
            </form>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Nama</th><th>Slug</th><th>Products</th><th>Aksi</th></tr></thead>
                    <tbody>
                        {categories.map((category) => (
                            <tr key={category.id}>
                                <td>{category.name}</td>
                                <td>{category.slug}</td>
                                <td>{category.products_count}</td>
                                <td className="actions">
                                    <button className="btn ghost" onClick={() => editCategory(category)}>Edit</button>
                                    <button className="btn danger" onClick={() => setDeletingCategoryItem(category)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
