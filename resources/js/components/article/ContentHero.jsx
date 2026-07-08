export default function ContentHero({ title, search, setSearch, navigate }) {
    return (
        <section className="explore-hero relative grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] gap-7 items-center overflow-hidden border border-[#e1d4c4] rounded-lg p-6 md:p-11 bg-[radial-gradient(circle_at_82%_18%,rgba(47,109,86,0.18),transparent_30%),linear-gradient(135deg,#fffaf2,#eee1d1)] shadow-[0_18px_60px_rgba(53,34,20,0.1)]">
            <div className="grid gap-4 max-w-[680px]">
                <p className="eyebrow text-xs font-black uppercase text-[#b77825] tracking-wider">Explore coffee intelligence</p>
                <h1 className="max-w-[780px] m-0 text-3xl md:text-5xl font-extrabold tracking-tight leading-none text-[#111111]">{title}</h1>
                <p className="max-w-[620px] m-0 text-[#5d5146] text-base leading-relaxed">Review, brewing guide, comparison, deals, dan rekomendasi affiliate yang terhubung ke marketplace kopi.</p>
                <div className="flex flex-wrap gap-2.5 mt-2">
                    <button className="btn primary" type="button" onClick={() => document.getElementById('explore-articles')?.scrollIntoView({ behavior: 'smooth' })}>
                        Baca Artikel
                    </button>
                    <button className="btn ghost" type="button" onClick={() => navigate('products')}>
                        Belanja Kopi
                    </button>
                </div>
            </div>
            <div className="explore-search-panel grid gap-3 border border-[#e1d4c4] rounded-lg p-4 bg-[rgba(255,253,249,0.78)] shadow-[0_12px_34px_rgba(53,34,20,0.08)]">
                <label className="grid gap-1.5">
                    <span className="block mb-1.5 text-[#4d4035] text-[0.86rem] font-bold">Cari insight kopi</span>
                    <input 
                        placeholder="Cari review, brewing, setup, atau beans" 
                        value={search} 
                        onChange={(event) => setSearch(event.target.value)} 
                        className="w-full border border-[#d8cbbc] rounded-lg px-3 py-2.5 bg-[#fffdf9] color-[#261c15] focus:outline-none focus:ring-2 focus:ring-[#5b3825] focus:border-transparent transition-all"
                    />
                </label>
            </div>
        </section>
    );
}
