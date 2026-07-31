import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import Dropdown from '../../components/admin/Dropdown.jsx';
import { AFFILIATE_PROFILE_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminAffiliatesPage({ token, navigate, setNotice, user, logout, notice }) {
    const [affiliates, setAffiliates] = useState([]);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!token) return;
        loadAffiliates();
    }, [token, status]);

    async function loadAffiliates() {
        const query = status ? `?status=${status}` : '';
        const response = await apiRequest(`/admin/affiliates${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setAffiliates(rowsFrom(response));
    }

    async function updateAffiliate(affiliate, patch) {
        try {
            await apiRequest(`/admin/affiliates/${affiliate.id}`, { method: 'PATCH', token, body: patch });
            setNotice('Affiliate diperbarui.');
            loadAffiliates();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    const filteredAffiliates = affiliates.filter(a => 
        a.affiliate_name?.toLowerCase().includes(search.toLowerCase()) || 
        a.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        a.code?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout current="admin-affiliates" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageHeader 
                title="Affiliate Management" 
                description="Kelola program afiliasi, pantau performa, dan atur komisi setiap afiliator."
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="     Cari afiliator berdasarkan nama, email, atau kode..."
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
                <div>
                    <Dropdown
                        value={status}
                        onChange={setStatus}
                        options={[{ value: '', label: 'Semua Status' }, ...AFFILIATE_PROFILE_STATUSES.map((item) => ({ value: item, label: item }))]}
                        ariaLabel="Filter status"
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                <th className="px-6 py-4">Afiliator</th>
                                <th className="px-6 py-4">Kode</th>
                                <th className="px-6 py-4">Rate (%)</th>
                                <th className="px-6 py-4">Klik</th>
                                <th className="px-6 py-4">Konversi</th>
                                <th className="px-6 py-4">Total Komisi</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAffiliates.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                                        Tidak menemukan data afiliasi.
                                    </td>
                                </tr>
                            ) : (
                                filteredAffiliates.map((affiliate) => (
                                    <tr key={affiliate.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="block font-semibold text-black text-sm">{affiliate.affiliate_name || affiliate.user?.name || '-'}</span>
                                            <span className="block text-xs text-gray-500">{affiliate.user?.email}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-black">{affiliate.code}</td>
                                        <td className="px-6 py-4">
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={affiliate.commission_rate}
                                                onChange={(event) => updateAffiliate(affiliate, { commission_rate: Number(event.target.value) })}
                                                className="w-16 px-2 py-1 border border-gray-200 rounded-md text-xs text-center focus:outline-none focus:border-black"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-black">{affiliate.clicks_count}</td>
                                        <td className="px-6 py-4 text-sm text-black">{affiliate.summary?.total_conversions || 0}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-black">{formatPrice(affiliate.summary?.total_commission)}</td>
                                        <td className="px-6 py-4">
                                            <Dropdown
                                                compact
                                                value={affiliate.status}
                                                onChange={(value) => updateAffiliate(affiliate, { status: value })}
                                                options={AFFILIATE_PROFILE_STATUSES.map((item) => ({ value: item, label: item }))}
                                                ariaLabel="Ubah status"
                                            />
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
