import '../../../css/auth.css';
import { useState } from 'react';
import { Component as AnimatedCharactersLoginPage } from '../../components/ui/animated-characters-login-page.tsx';
import { apiRequest } from '../../services/api.js';
import { canOpenAfterLogin, defaultLandingFor } from '../../utils/route.js';

export default function AuthPage({ mode, saveSession, navigate, notice, setNotice }) {
    const [isSeller, setIsSeller] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        store_name: '',
        phone: '',
        address: '',
        origin_city: '',
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
            saveSession(data.token, data.user, { persist: true });
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
        <AnimatedCharactersLoginPage
            form={form}
            isSeller={isSeller}
            loading={loading}
            mode={mode}
            notice={notice}
            onNavigate={navigate}
            onSelectSeller={setIsSeller}
            onSubmit={submit}
            onUpdate={update}
        />
    );
}
