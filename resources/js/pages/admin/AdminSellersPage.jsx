import { useEffect, useState } from 'react';
import DetailPanel from '../../components/common/DetailPanel.jsx';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import PageHeader from '../../components/common/PageHeader.jsx';
import { SELLER_STATUSES } from '../../constants/statuses.js';
import { apiRequest } from '../../services/api.js';
import { formatPrice, rowsFrom } from '../../utils/format.js';
import AdminLayout from './AdminLayout.jsx';

export default function AdminSellersPage({ token, navigate, setNotice, user, logout, notice }) {
    const [sellers, setSellers] = useState([]);
    const [status, setStatus] = useState('');
    const [search, setSearch] = useState('');
    const [detail, setDetails] = useState(null);

    useEffect(() => {
        if (!token) return;
        loadSellers();
    }, [token, status]);

    async function loadSellers() {
        const query = status ? `?status=${status}` : '';
        const response = await apiRequest(`/admin/sellers${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setSellers(rowsFrom(response));
    }

    async function sellerAction(seller, action) {
        try {
            await apiRequest(`/admin/sellers/${seller.id}/${action}`, { method: 'POST', token });
            setNotice('Status seller diperbarui.');
            loadSellers();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function showSeller(seller) {
        const response = await apiRequest(`/admin/sellers/${seller.id}`, { token }).catch((error) => {
            setNotice(error.message);
            return null;
        });
        if (response) setDetails(response.data);
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    const filteredSellers = sellers.filter(s => 
        s.store_name?.toLowerCase().includes(search.toLowerCase()) || 
        s.user?.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AdminLayout current="admin-sellers" navigate={navigate} user={user} logout={logout} notice={notice}>
            <PageHeader 
                title="Seller Management" 
                description="Verifikasi toko baru, suspend/aktifkan akun penjual, dan pantau performa masing-masing toko."
            />

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="     Cari toko berdasarkan nama atau email pemilik..."
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
                        {SELLER_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                                <th className="px-6 py-4">Toko / Pemilik</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Produk</th>
                                <th className="px-6 py-4">Pesanan</th>
                                <th className="px-6 py-4">Pendapatan</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSellers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                                        Tidak menemukan data seller.
                                    </td>
                                </tr>
                            ) : (
                                filteredSellers.map((seller) => (
                                    <tr key={seller.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold">
                                                    {seller.store_name?.[0]?.toUpperCase() || 'S'}
                                                </div>
                                                <div>
                                                    <span className="block font-semibold text-black text-sm">{seller.store_name}</span>
                                                    <span className="block text-xs text-gray-500">{seller.user?.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                                                seller.status === 'active' ? 'bg-gray-100 text-black border border-gray-300' :
                                                seller.status === 'pending' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                                                'bg-red-50 text-red-800 border border-red-200'
                                            }`}>
                                                {seller.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-black">{seller.products_count}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-black">{seller.total_orders}</td>
                                        <td className="px-6 py-4 text-sm font-semibold text-black">{formatPrice(seller.total_revenue)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex gap-2">
                                                <button onClick={() => showSeller(seller)} className="text-xs font-semibold px-2.5 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                                                    Details
                                                </button>
                                                {seller.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => sellerAction(seller, 'approve')} className="text-xs font-semibold px-2.5 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
                                                            Approve
                                                        </button>
                                                        <button onClick={() => sellerAction(seller, 'reject')} className="text-xs font-semibold px-2.5 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors">
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {seller.status === 'active' && (
                                                    <button onClick={() => sellerAction(seller, 'suspend')} className="text-xs font-semibold px-2.5 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors">
                                                        Suspend
                                                    </button>
                                                )}
                                                {seller.status === 'rejected' && (
                                                    <button onClick={() => sellerAction(seller, 'approve')} className="text-xs font-semibold px-2.5 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
                                                        (Approve)
                                                    </button>
                                                )}
                                                {seller.status === 'suspended' && (
                                                    <button onClick={() => sellerAction(seller, 'approve')} className="text-xs font-semibold px-2.5 py-1.5 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
                                                        Aktifkan Kembali
                                                    </button>
                                                )}
                                            </div>
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
                    title={detail.store_name} 
                    onClose={() => setDetails(null)}
                    rows={[
                        ['Pemilik', detail.user?.name],
                        ['Email', detail.user?.email],
                        ['Telepon', detail.phone || '-'],
                        ['Status', detail.status],
                        ['Total produk', detail.products_count],
                        ['Total order', detail.total_orders],
                        ['Revenue', formatPrice(detail.total_revenue)],
                    ]} 
                />
            )}
        </AdminLayout>
    );
}
