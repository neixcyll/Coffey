export default function NeedCustomerAccount({ logout }) {
    return (
        <div className="panel empty-state p-6 border border-[#e1d4c4] rounded-lg bg-[#fffdf9] shadow-[0_8px_24px_rgba(53,34,20,0.06)] max-w-[520px] mx-auto my-8 text-center flex flex-col items-center gap-4">
            <h1 className="text-2xl font-black text-[#38291e]">Akun customer diperlukan</h1>
            <p className="muted text-[#75695d] text-sm leading-relaxed">Affiliate hanya tersedia untuk akun customer. Logout lalu masuk dengan akun customer untuk membuka dashboard affiliate.</p>
            <button className="btn primary" onClick={() => logout()}>Logout</button>
        </div>
    );
}
