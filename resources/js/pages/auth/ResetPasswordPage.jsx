import { useState } from 'react';
import { Eye, EyeOff, LoaderCircle, ShoppingBag } from 'lucide-react';
import { apiRequest } from '../../services/api.js';

export default function ResetPasswordPage({ token, navigate, setNotice }) {
    const email = new URLSearchParams(window.location.search).get('email') || '';
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function submit(event) {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            await apiRequest('/reset-password', {
                method: 'POST',
                body: { token, email, password, password_confirmation: confirmation },
            });
            setNotice('Password berhasil direset. Silakan login dengan password baru.');
            navigate('login');
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }

    if (!token || !email) {
        return (
            <section className="flex min-h-full w-full items-center justify-center bg-[#f6f1ea] px-4 py-10">
                <div className="w-full max-w-lg rounded-2xl border border-[#ecd8c4] bg-white p-6 text-center shadow-[0_18px_40px_rgba(90,60,30,.10)] sm:p-8">
                    <ShoppingBag size={22} className="mx-auto text-[#9c4f2e]" />
                    <h1 className="mt-3 text-lg font-bold text-[#2a2118]">Tautan tidak valid</h1>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#7a6a58]">
                        Tautan reset password ini tidak lengkap atau sudah tidak berlaku. Silakan minta tautan baru.
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('forgot-password')}
                        className="mt-5 rounded-lg bg-[#9c4f2e] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#7e3f25]"
                    >
                        Minta tautan baru
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="flex min-h-full w-full items-center justify-center bg-[#f6f1ea] px-4 py-10">
            <div className="w-full max-w-lg rounded-2xl border border-[#ecd8c4] bg-white p-6 shadow-[0_18px_40px_rgba(90,60,30,.10)] sm:p-8">
                <div className="mb-5 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-[#9c4f2e]" />
                    <span className="text-base font-bold text-[#2a2118]">Coffey</span>
                </div>

                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#9c4f2e]">Set new password</p>
                <h1 className="mb-2 text-sm font-bold text-[#2a2118]">Buat password baru</h1>
                <p className="text-sm leading-relaxed text-[#7a6a58]">
                    Atur password baru untuk akun <span className="font-semibold text-[#4a4035]">{email}</span>.
                </p>

                <form onSubmit={submit} className="mt-5 space-y-4">
                    <label className="block space-y-1.5">
                        <span className="text-sm text-[#4a4035]">Password baru</span>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Minimal 8 karakter"
                                required
                                minLength={8}
                                autoComplete="new-password"
                                className="h-11 w-full rounded-lg border border-[#e0c4a8] bg-white px-4 pr-12 text-sm text-[#2a2118] outline-none transition placeholder:text-[#b48f6b] focus:border-[#9c4f2e] focus:ring-2 focus:ring-[#9c4f2e]/20"
                            />
                            <button
                                type="button"
                                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                onClick={() => setShowPassword((current) => !current)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a5805f] hover:text-[#7a5334]"
                            >
                                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </div>
                    </label>

                    <label className="block space-y-1.5">
                        <span className="text-sm text-[#4a4035]">Konfirmasi password</span>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={confirmation}
                            onChange={(event) => setConfirmation(event.target.value)}
                            placeholder="Ulangi password"
                            required
                            minLength={8}
                            autoComplete="new-password"
                            className="h-11 w-full rounded-lg border border-[#e0c4a8] bg-white px-4 text-sm text-[#2a2118] outline-none transition placeholder:text-[#b48f6b] focus:border-[#9c4f2e] focus:ring-2 focus:ring-[#9c4f2e]/20"
                        />
                    </label>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex h-11 w-full items-center justify-center rounded-lg bg-[#9c4f2e] px-6 text-sm font-bold text-white transition hover:bg-[#7e3f25] disabled:opacity-60"
                    >
                        {loading && <LoaderCircle className="mr-2 animate-spin" size={16} />}
                        {loading ? 'Menyimpan...' : 'Simpan password baru'}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm text-[#7a6a58]">
                    Ingat password kamu?{' '}
                    <button type="button" onClick={() => navigate('login')} className="font-semibold text-[#2563eb] hover:underline">
                        Masuk di sini
                    </button>
                </p>
            </div>
        </section>
    );
}
