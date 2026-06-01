import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import TextInput from '../../components/common/TextInput.jsx';
import { apiRequest } from '../../services/api.js';

export default function CustomerAccountSettings({ token, user, navigate, setNotice, updateCurrentUser }) {
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        password_confirmation: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setForm((current) => ({
            ...current,
            name: user?.name || '',
            email: user?.email || '',
        }));
    }, [user?.id, user?.name, user?.email]);

    async function saveAccount(event) {
        event.preventDefault();
        setSaving(true);
        setNotice('');

        try {
            const payload = {
                name: form.name,
                email: form.email,
            };

            if (form.password) {
                payload.password = form.password;
                payload.password_confirmation = form.password_confirmation;
            }

            const response = await apiRequest('/user', { method: 'PATCH', token, body: payload });
            updateCurrentUser(response.user);
            setForm((current) => ({ ...current, password: '', password_confirmation: '' }));
            setNotice(response.message);
        } catch (error) {
            setNotice(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section className="customer-account-page">
            <div className="customer-section-head">
                <div>
                    <p className="eyebrow">Pengaturan Akun</p>
                    <h2>Profil customer</h2>
                    <p className="muted">Perbarui identitas akun dan password login kamu.</p>
                </div>
            </div>

            <form className="panel form-grid customer-account-form" onSubmit={saveAccount}>
                <div className="customer-account-form-section">
                    <div>
                        <p className="eyebrow">Informasi akun</p>
                        <h3>Data utama</h3>
                    </div>
                    <div className="form-grid">
                        <TextInput label="Nama" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                        <TextInput label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
                    </div>
                </div>

                <div className="customer-account-form-section">
                    <div>
                        <p className="eyebrow">Keamanan</p>
                        <h3>Ubah password</h3>
                        <p className="muted">Kosongkan jika password tidak ingin diubah.</p>
                    </div>
                    <div className="form-grid">
                        <TextInput label="Password baru" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} required={false} />
                        <TextInput label="Konfirmasi password" type="password" value={form.password_confirmation} onChange={(value) => setForm({ ...form, password_confirmation: value })} required={false} />
                    </div>
                </div>

                <button className="btn primary customer-account-save" disabled={saving}>
                    {saving ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
            </form>
        </section>
    );
}
