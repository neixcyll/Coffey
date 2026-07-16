import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import TextArea from '../../components/common/TextArea.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { apiRequest } from '../../services/api.js';

const emptyProfilee = {
    store_name: '',
    phone: '',
    address: '',
    origin_city: '',
    description: '',
    status: '',
};

export default function SellerProfile({ token, user, navigate, setNotice, updateCurrentUser }) {
    const [profile, setProfilee] = useState(() => SellerProfileFromUser(user));
    const [form, setForm] = useState(() => ({ ...emptyProfilee, ...SellerProfileFromUser(user) }));
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const nextProfilee = SellerProfileFromUser(user);
        if (nextProfilee?.id) {
            setProfilee(nextProfilee);
            setForm({ ...emptyProfilee, ...nextProfilee });
        }
    }, [user?.seller_profile?.id, user?.SellerProfile?.id]);

    useEffect(() => {
        if (!token) return;

        setLoading(true);
        apiRequest('/seller/profile', { token })
            .then((response) => {
                setProfilee(response.data);
                setForm({ ...emptyProfilee, ...response.data });
            })
            .catch((error) => setNotice(error.message))
            .finally(() => setLoading(false));
    }, [token, setNotice]);

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        setNotice('');

        try {
            const response = await apiRequest('/seller/profile', {
                method: 'PATCH',
                token,
                body: {
                    store_name: form.store_name,
                    phone: form.phone,
                    address: form.address,
                    origin_city: form.origin_city,
                    description: form.description,
                },
            });
            const nextProfilee = response.data;
            const nextUser = {
                ...user,
                seller_profile: nextProfilee,
                SellerProfile: nextProfilee,
            };

            setProfilee(nextProfilee);
            setForm({ ...emptyProfilee, ...nextProfilee });
            updateCurrentUser?.(nextUser);
            setNotice(response.message || 'Profile toko berhasil diperbarui.');
        } catch (error) {
            setNotice(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section className="p-6 md:p-8 max-w-6xl mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-sm font-semibold tracking-wide text-gray-500 uppercase mb-1">Profile Toko</p>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-black tracking-tight mb-2">Store Profile</h1>
                    <p className="text-gray-500">Kelola identitas toko yang muncul di katalog marketplace.</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    profile?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                }`}>
                    {profile?.status || 'seller'}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <form className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" onSubmit={submit}>
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <TextInput label="Nama Store" value={form.store_name || ''} onChange={(value) => update('store_name', value)} />
                            <TextInput label="Phone" value={form.phone || ''} onChange={(value) => update('phone', value)} required={false} />
                        </div>
                        
                        <TextArea label="Alamat Store" value={form.address || ''} onChange={(value) => update('address', value)} />
                        
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <TextInput label="Kota Asal Pengiriman" value={form.origin_city || ''} helper="Dipakai untuk mencari tarif ongkir saat customer checkout." placeholder="Contoh: Bandung" onChange={(value) => update('origin_city', value)} />
                        </div>
                        
                        <TextArea label="Deskripsi Store" value={form.description || ''} onChange={(value) => update('description', value)} />
                    </div>
                    
                    <div className="px-6 md:px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-end">
                        <button className="px-6 py-2.5 bg-black hover:bg-gray-900 text-white font-semibold rounded-lg shadow-sm transition-colors focus:ring-4 focus:ring-gray-200 disabled:opacity-70 disabled:cursor-not-allowed" disabled={saving || loading}>
                            {saving ? 'Menyimpan...' : 'Save Profile'}
                        </button>
                    </div>
                </form>

                <aside className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-8">
                    <div className="p-6 md:p-8 flex flex-col items-center text-center border-b border-gray-100 bg-gray-50/50">
                        <span className="w-20 h-20 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md mb-4 ring-4 ring-white">
                            {initials(form.store_name || user?.name)}
                        </span>
                        <div>
                            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1">Preview Toko</p>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">{form.store_name || 'Nama Store'}</h2>
                            <p className="text-sm text-gray-500 line-clamp-3">{form.description || 'Store description belum diisi.'}</p>
                        </div>
                    </div>
                    
                    <dl className="divide-y divide-gray-100 p-0 m-0">
                        <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between gap-1">
                            <dt className="text-sm font-semibold text-gray-500">Telepon</dt>
                            <dd className="text-sm font-bold text-gray-900 sm:text-right">{form.phone || '-'}</dd>
                        </div>
                        <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between gap-1">
                            <dt className="text-sm font-semibold text-gray-500">Alamat</dt>
                            <dd className="text-sm font-bold text-gray-900 sm:text-right sm:max-w-[150px] truncate" title={form.address}>{form.address || '-'}</dd>
                        </div>
                        <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between gap-1">
                            <dt className="text-sm font-semibold text-gray-500">Kota Pengiriman</dt>
                            <dd className="text-sm font-bold text-gray-900 sm:text-right">{form.origin_city || '-'}</dd>
                        </div>
                        <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between gap-1">
                            <dt className="text-sm font-semibold text-gray-500">Status</dt>
                            <dd className="text-sm font-bold text-gray-900 sm:text-right capitalize">{profile?.status || '-'}</dd>
                        </div>
                    </dl>
                </aside>
            </div>
        </section>
    );
}

function SellerProfileFromUser(user) {
    return user?.seller_profile || user?.SellerProfile || emptyProfilee;
}

function initials(value) {
    return (value || 'Seller')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}
