import { useState } from 'react';
import { LoaderCircle, MailCheck, ShoppingBag } from 'lucide-react';
import { apiRequest } from '../../services/api.js';

export default function ForgotPasswordPage({ navigate }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSent(false);

        try {
            await apiRequest('/forgot-password', { method: 'POST', body: { email } });
            setSent(true);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="flex min-h-full w-full items-center justify-center bg-[#f6f1ea] px-4 py-10">
            <div className="w-full max-w-lg rounded-2xl border border-[#ecd8c4] bg-white p-6 shadow-[0_18px_40px_rgba(90,60,30,.10)] sm:p-8">
                <div className="mb-5 flex items-center gap-2">
                    <ShoppingBag size={18} className="text-[#9c4f2e]" />
                    <span className="text-base font-bold text-[#2a2118]">Coffey</span>
                </div>

                <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-[#9c4f2e]">Recover account</p>
                <h1 className="mb-2 text-base font-bold text-[#2a2118]">Lupa password?</h1>

                {sent ? (
                    <div>
                        <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#f6e9dc] p-4">
                            <MailCheck size={20} className="shrink-0 text-[#9c4f2e]" />
                            <p className="text-sm leading-relaxed text-[#5f3d24]">
                                Jika email terdaftar, tautan reset password telah dikirim. Periksa kotak masuk (dan folder spam) kamu.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('login')}
                            className="mt-5 w-full rounded-xl bg-[#9c4f2e] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#7e3f25]"
                        >
                            Kembali ke login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={submit} className="mt-5">
                        <p className="mb-4 text-sm leading-relaxed text-[#7a6a58]">
                            Masukkan email yang terdaftar pada akun Coffey kamu. Kami akan mengirimkan tautan untuk mereset password.
                        </p>

                        <label className="space-y-1.5">
                            <span className="text-sm text-[#4a4035]">Email</span>
                            <input
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="nama@email.com"
                                required
                                className="h-11 w-full rounded-lg border border-[#e0c4a8] bg-white px-4 text-sm text-[#2a2118] outline-none transition placeholder:text-[#b48f6b] focus:border-[#9c4f2e] focus:ring-2 focus:ring-[#9c4f2e]/20"
                            />
                        </label>

                        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-5 flex h-11 w-full items-center justify-center rounded-lg bg-[#9c4f2e] px-6 text-sm font-bold text-white transition hover:bg-[#7e3f25] disabled:opacity-60"
                        >
                            {loading && <LoaderCircle className="mr-2 animate-spin" size={16} />}
                            {loading ? 'Mengirim...' : 'Kirim tautan reset'}
                        </button>
                    </form>
                )}

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
