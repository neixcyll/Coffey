import { rememberCurrentRoute } from '../../utils/route.js';

export default function NeedLogin({ navigate }) {
    function goLogin() {
        rememberCurrentRoute();
        navigate('login');
    }

    return (
        <div className="panel empty-state p-6 border border-[#e1d4c4] rounded-lg bg-[#fffdf9] shadow-[0_8px_24px_rgba(53,34,20,0.06)] max-w-[520px] mx-auto my-8 text-center flex flex-col items-center gap-4">
            <h1 className="text-2xl font-black text-[#38291e]">Login diperlukan</h1>
            <p className="muted text-[#75695d] text-sm leading-relaxed">Masuk dengan role yang sesuai untuk membuka halaman ini.</p>
            <button className="btn primary" onClick={goLogin}>Login</button>
        </div>
    );
}
