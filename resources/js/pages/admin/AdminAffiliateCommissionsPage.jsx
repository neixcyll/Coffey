import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { AFFILIATE_COMMISSION_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminAffiliateCommissionsPage({ token, navigate, setNotice, user, logout, notice }) {
    const [commissions, setCommissions] = useState([]);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!token) return;
        loadCommissions();
    }, [token, status]);

    async function loadCommissions() {
        const query = status ? `?status=${status}` : '';
        const response = await apiRequest(`/admin/affiliate-commissions${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setCommissions(rowsFrom(response));
    }

    async function updateCommission(commission, nextStatus) {
        try {
            await apiRequest(`/admin/affiliate-commissions/${commission.id}`, { method: 'PATCH', token, body: { status: nextStatus } });
            setNotice('Status komisi diperbarui.');
            loadCommissions();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    const filteredCommissions = commissions.filter(c => 
        c.affiliate_profile?.code?.toLowerCase().includes(search.toLowerCase()) || 
        c.order?.order_number?.toLowerCase().includes(search.toLowerCase()) ||
        c.seller?.store_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout current="admin-affiliate-commissions" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageHeader 
                title="Affiliate Commissions" 
                description="Kelola dan verifikasi pembayaran komisi untuk afiliator berdasarkan transaksi yang berhasil."
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="     Cari berdasarkan kode afiliator, order, atau nama toko..."
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
                    <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-black"
                    >
                        <option value="">Semua Status</option>
                        {AFFILIATE_COMMISSION_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                <th className="px-6 py-4">Affiliate</th>
                                <th className="px-6 py-4">Order</th>
                                <th className="px-6 py-4">Produk</th>
                                <th className="px-6 py-4">Seller</th>
                                <th className="px-6 py-4">Subtotal</th>
                                <th className="px-6 py-4">Komisi</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCommissions.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">
                                        Tidak menemukan data komisi.
                                    </td>
                                </tr>
                            ) : (
                                filteredCommissions.map((commission) => (
                                    <tr key={commission.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className="block font-semibold text-black text-sm font-mono">{commission.affiliate_profile?.code}</span>
                                            <span className="block text-xs text-gray-500">{commission.affiliate_profile?.user?.email}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-black font-mono">{commission.order?.order_number}</td>
                                        <td className="px-6 py-4 text-sm text-gray-800">{commission.product?.name || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-800">{commission.seller?.store_name || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-black">{formatPrice(commission.amount)}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-black">{formatPrice(commission.commission_amount)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <select 
                                                value={commission.status} 
                                                onChange={(e) => updateCommission(commission, e.target.value)}
                                                className={`border border-gray-200 rounded-md py-1 px-2 text-xs font-semibold bg-white focus:outline-none focus:border-black ${
                                                    commission.status === 'paid' ? 'text-green-700' :
                                                    commission.status === 'pending' ? 'text-yellow-700' :
                                                    'text-red-700'
                                                }`}
                                            >
                                                {AFFILIATE_COMMISSION_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                                            </select>
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
