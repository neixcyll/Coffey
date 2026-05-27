import { useEffect, useState } from 'react';
import DetailPanel from '../../components/common/DetailPanel.jsx';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageTitle from '../../components/common/PageTitle.jsx';
import { USER_ROLES, USER_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminUsersPage({ token, navigate, setNotice, user, logout, notice }) {
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({ role: '', status: '' });
    const [detail, setDetail] = useState(null);

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
        if (response) setDetail(response.data);
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-users" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageTitle eyebrow="Admin" title="User management" />
            <div className="filters compact">
                <select value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
                    <option value="">Semua role</option>
                    {USER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                    <option value="">Semua status</option>
                    {USER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <select value={user.role?.name || ''} onChange={(event) => updateUser(user, { role: event.target.value })}>
                                        {USER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                </td>
                                <td>
                                    <select value={user.status || 'active'} onChange={(event) => updateUser(user, { status: event.target.value })}>
                                        {USER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </td>
                                <td><button className="btn ghost" onClick={() => showUser(user)}>Detail</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {detail && <DetailPanel title={detail.name} rows={[
                ['Email', detail.email],
                ['Role', detail.role?.name],
                ['Status', detail.status],
                ['Seller', detail.seller_profile?.store_name || '-'],
            ]} />}
        </AdminLayout>
    );
}
