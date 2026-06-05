import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import TextArea from '../../components/common/TextArea.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { apiRequest } from '../../services/api.js';

const emptyProfile = {
    store_name: '',
    phone: '',
    address: '',
    origin_city: '',
    description: '',
    status: '',
};

export default function SellerProfile({ token, user, navigate, setNotice, updateCurrentUser }) {
    const [profile, setProfile] = useState(() => sellerProfileFromUser(user));
    const [form, setForm] = useState(() => ({ ...emptyProfile, ...sellerProfileFromUser(user) }));
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const nextProfile = sellerProfileFromUser(user);
        if (nextProfile?.id) {
            setProfile(nextProfile);
            setForm({ ...emptyProfile, ...nextProfile });
        }
    }, [user?.seller_profile?.id, user?.sellerProfile?.id]);

    useEffect(() => {
        if (!token) return;

        setLoading(true);
        apiRequest('/seller/profile', { token })
            .then((response) => {
                setProfile(response.data);
                setForm({ ...emptyProfile, ...response.data });
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
            const nextProfile = response.data;
            const nextUser = {
                ...user,
                seller_profile: nextProfile,
                sellerProfile: nextProfile,
            };

            setProfile(nextProfile);
            setForm({ ...emptyProfile, ...nextProfile });
            updateCurrentUser?.(nextUser);
            setNotice(response.message || 'Profil toko berhasil diperbarui.');
        } catch (error) {
            setNotice(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section className="seller-profile-page">
            <div className="section-head seller-page-head">
                <div>
                    <p className="eyebrow">Profil toko</p>
                    <h1>Profil Toko</h1>
                    <p className="muted">Kelola identitas toko yang muncul di katalog marketplace.</p>
                </div>
                <span className={`badge ${profile?.status === 'active' ? 'verified' : ''}`}>
                    {profile?.status || 'seller'}
                </span>
            </div>

            <div className="seller-profile-grid">
                <form className="panel form-grid seller-profile-form" onSubmit={submit}>
                    <TextInput label="Nama Toko" value={form.store_name || ''} onChange={(value) => update('store_name', value)} />
                    <TextInput label="Telepon" value={form.phone || ''} onChange={(value) => update('phone', value)} required={false} />
                    <TextArea label="Alamat Toko" value={form.address || ''} onChange={(value) => update('address', value)} />
                    <TextInput label="Kota Asal Pengiriman" value={form.origin_city || ''} helper="Dipakai untuk mencari tarif ongkir saat customer checkout." placeholder="Contoh: Bandung" onChange={(value) => update('origin_city', value)} />
                    <TextArea label="Deskripsi Toko" value={form.description || ''} onChange={(value) => update('description', value)} />
                    <button className="btn primary" disabled={saving || loading}>{saving ? 'Menyimpan...' : 'Simpan Profil'}</button>
                </form>

                <aside className="panel seller-profile-summary">
                    <span className="seller-summary-avatar">{initials(form.store_name || user?.name)}</span>
                    <div>
                        <p className="eyebrow">Preview toko</p>
                        <h2>{form.store_name || 'Nama Toko'}</h2>
                        <p className="muted">{form.description || 'Deskripsi toko belum diisi.'}</p>
                    </div>
                    <dl className="seller-profile-details">
                        <div>
                            <dt>Telepon</dt>
                            <dd>{form.phone || '-'}</dd>
                        </div>
                        <div>
                            <dt>Alamat</dt>
                            <dd>{form.address || '-'}</dd>
                        </div>
                        <div>
                            <dt>Kota asal pengiriman</dt>
                            <dd>{form.origin_city || '-'}</dd>
                        </div>
                        <div>
                            <dt>Status</dt>
                            <dd>{profile?.status || '-'}</dd>
                        </div>
                    </dl>
                </aside>
            </div>
        </section>
    );
}

function sellerProfileFromUser(user) {
    return user?.seller_profile || user?.sellerProfile || emptyProfile;
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
