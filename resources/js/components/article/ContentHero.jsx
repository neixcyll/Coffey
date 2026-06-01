export default function ContentHero({ title, search, setSearch, navigate }) {
    return (
        <section className="explore-hero">
            <div>
                <p className="eyebrow">Explore coffee intelligence</p>
                <h1>{title}</h1>
                <p>Review, brewing guide, comparison, deals, dan rekomendasi affiliate yang terhubung ke marketplace kopi.</p>
                <div className="row">
                    <button className="btn primary" type="button" onClick={() => document.getElementById('explore-articles')?.scrollIntoView({ behavior: 'smooth' })}>
                        Baca Artikel
                    </button>
                    <button className="btn ghost" type="button" onClick={() => navigate('products')}>
                        Belanja Kopi
                    </button>
                </div>
            </div>
            <div className="explore-search-panel">
                <label>
                    <span>Cari insight kopi</span>
                    <input placeholder="Cari review, brewing, setup, atau beans" value={search} onChange={(event) => setSearch(event.target.value)} />
                </label>
            </div>
        </section>
    );
}
