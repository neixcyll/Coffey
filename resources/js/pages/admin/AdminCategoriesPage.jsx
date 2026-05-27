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
            setNotice(editing ? 'Kategori diperbarui.' : 'Kategori dibuat.');
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
                setNotice('Kategori dihapus.');
                loadCategories();
            })
            .catch((error) => setNotice(error.message));
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-categories" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageTitle eyebrow="Admin" title="Category management" />
            <form className="panel form-grid admin-form" onSubmit={saveCategory}>
                <TextInput label="Nama kategori" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                <TextArea label="Deskripsi" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
                <button className="btn primary">{editing ? 'Simpan kategori' : 'Tambah kategori'}</button>
            </form>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Nama</th><th>Slug</th><th>Produk</th><th>Aksi</th></tr></thead>
                    <tbody>
                        {categories.map((category) => (
                            <tr key={category.id}>
                                <td>{category.name}</td>
                                <td>{category.slug}</td>
                                <td>{category.products_count}</td>
                                <td className="actions">
                                    <button className="btn ghost" onClick={() => editCategory(category)}>Edit</button>
                                    <button className="btn danger" onClick={() => deleteCategory(category)}>Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
