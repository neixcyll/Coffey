import { useEffect, useState } from 'react';
import DetailPanel from '../../components/common/DetailPanel.jsx';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Dropdown from '../../components/admin/Dropdown.jsx';
import { USER_ROLES, USER_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminUsersPage({ token, navigate, setNotice, user, logout, notice }) {
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({ role: '', status: '' });
    const [search, setSearch] = useState('');
    const [detail, setDetails] = useState(null);

    useEffect(() => {
        if (!token) return;
        loadUsers();
    }, [token, filters.role, filters.status]);

    async function loadUsers() {
        const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
        const response = await apiRequest(`/admin/users?${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setUsers(rowsFrom(response));
    }

    async function updateUser(user, patch) {
        try {
            await apiRequest(`/admin/users/${user.id}`, { method: 'PATCH', token, body: patch });
            setNotice('User diperbarui.');
            loadUsers();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function showUser(user) {
        const response = await apiRequest(`/admin/users/${user.id}`, { token }).catch((error) => {
            setNotice(error.message);
            return null;
        });
        if (response) setDetails(response.data);
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    const filteredUsers = users.filter(u => 
        u.name?.toLowerCase().includes(search.toLowerCase()) || 
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout current="admin-users" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageHeader 
                title="User Management" 
                description="Kelola hak akses, status, dan data detail seluruh pengguna platform."
            />

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <input
                    type="text"
                    placeholder="    Cari user berdasarkan nama atau email..."
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
                        value={filters.role}
                        onChange={(value) => setFilters({ ...filters, role: value })}
                        options={[{ value: '', label: 'Semua Role' }, ...USER_ROLES.map((role) => ({ value: role, label: role }))]}
                        ariaLabel="Filter role"
                    />
                    <Dropdown
                        value={filters.status}
                        onChange={(value) => setFilters({ ...filters, status: value })}
                        options={[{ value: '', label: 'Semua Status' }, ...USER_STATUSES.map((status) => ({ value: status, label: status }))]}
                        ariaLabel="Filter status"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">
                                        Tidak menemukan data user.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-black">
                                                    {user.name?.[0]?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <span className="block font-semibold text-black text-sm">{user.name}</span>
                                                    <span className="block text-xs text-gray-500">{user.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Dropdown
                                                compact
                                                variant="light"
                                                className="w-28"
                                                value={user.role?.name || ''}
                                                onChange={(value) => updateUser(user, { role: value })}
                                                options={USER_ROLES.map((role) => ({ value: role, label: role }))}
                                                ariaLabel="Ubah role"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <Dropdown
                                                compact
                                                variant="light"
                                                className="w-28"
                                                value={user.status || 'active'}
                                                onChange={(value) => updateUser(user, { status: value })}
                                                options={USER_STATUSES.map((status) => ({ value: status, label: status }))}
                                                ariaLabel="Ubah status"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => showUser(user)}
                                                className="text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {detail && (
                <DetailPanel 
                    title={detail.name} 
                    onClose={() => setDetails(null)}
                    rows={[
                        ['Email', detail.email],
                        ['Role', detail.role?.name],
                        ['Status', detail.status],
                        ['Store', detail.seller_profile?.store_name || '-'],
                    ]} 
                />
            )}
        </AdminLayout>
    );
}
