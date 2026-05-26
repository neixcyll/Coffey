import { useState } from 'react';
import { apiRequest } from '../../services/api.js';
import { canOpenAfterLogin, defaultLandingFor } from '../../utils/route.js';
import TextArea from '../../components/common/TextArea.jsx';
import TextInput from '../../components/common/TextInput.jsx';

export default function AuthPage({ mode, saveSession, navigate, setNotice }) {
    const [isSeller, setIsSeller] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        store_name: '',
        phone: '',
        address: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const isLogin = mode === 'login';

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    async function submit(event) {
        event.preventDefault();
        setLoading(true);
        setNotice('');

        try {
            const path = isLogin ? '/login' : isSeller ? '/register/seller' : '/register';
            const payload = isLogin
                ? { email: form.email, password: form.password }
                : form;
            const data = await apiRequest(path, { method: 'POST', body: payload });
            saveSession(data.token, data.user);
            setNotice(data.message);
            const redirect = sessionStorage.getItem('post_login_redirect');
            sessionStorage.removeItem('post_login_redirect');
            navigate(canOpenAfterLogin(redirect, data.user) ? redirect : defaultLandingFor(data.user));
        } catch (error) {
            setNotice(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="auth-layout">
            <div>
                <p className="eyebrow">Akses akun</p>
                <h1>{isLogin ? 'Login' : 'Register'}</h1>
                <p className="muted">Gunakan akun seeder: admin@kopi.test, seller@kopi.test, atau customer@kopi.test dengan password <code>password</code>.</p>
            </div>
            <form className="panel form-grid" onSubmit={submit}>
                {!isLogin && (
                    <div className="segmented">
                        <button type="button" className={!isSeller ? 'selected' : ''} onClick={() => setIsSeller(false)}>Customer</button>
                        <button type="button" className={isSeller ? 'selected' : ''} onClick={() => setIsSeller(true)}>Seller</button>
                    </div>
                )}
                {!isLogin && <TextInput label="Nama" value={form.name} onChange={(value) => update('name', value)} />}
                <TextInput label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} />
                <TextInput label="Password" type="password" value={form.password} onChange={(value) => update('password', value)} />
                {!isLogin && <TextInput label="Konfirmasi Password" type="password" value={form.password_confirmation} onChange={(value) => update('password_confirmation', value)} />}
                {!isLogin && isSeller && (
                    <>
                        <TextInput label="Nama Toko" value={form.store_name} onChange={(value) => update('store_name', value)} />
                        <TextInput label="Telepon" value={form.phone} onChange={(value) => update('phone', value)} required={false} />
                        <TextArea label="Alamat Toko" value={form.address} onChange={(value) => update('address', value)} />
                        <TextArea label="Deskripsi Toko" value={form.description} onChange={(value) => update('description', value)} />
                    </>
                )}
                <button className="btn primary wide" disabled={loading}>{loading ? 'Memproses...' : isLogin ? 'Login' : 'Register'}</button>
            </form>
        </section>
    );
}
