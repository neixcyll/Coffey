const steps = [
    {
        label: 'Customer',
        title: 'Find coffee faster',
        body: 'Search products, compare variants, and checkout in one focused flow.',
    },
    {
        label: 'Seller',
        title: 'Sell with clarity',
        body: 'Manage catalog, stock, orders, and reviews from the seller dashboard.',
    },
    {
        label: 'Affiliate',
        title: 'Recommend products',
        body: 'Publish coffee content and share trackable product recommendations.',
    },
];

export default function AboutPage({ navigate }) {
    return (
        <section className="about-page">
            <header className="about-hero">
                <div>
                    <p className="eyebrow">About Coffey</p>
                    <h1>A modern marketplace for coffee products, sellers, and creators.</h1>
                    <p>Coffey keeps coffee discovery simple: products first, clear seller context, and creator recommendations when they help.</p>
                    <div className="home-hero-actions">
                        <button className="btn primary" type="button" onClick={() => navigate('blog')}>Explore products</button>
                        <button className="btn ghost" type="button" onClick={() => navigate('affiliate-dashboard')}>Affiliate program</button>
                    </div>
                </div>
                <img
                    src="https://images.unsplash.com/photo-1518057111178-44a106bad636?auto=format&fit=crop&w=1000&q=85"
                    alt="Coffee roastery workspace"
                />
            </header>

            <section className="about-split">
                <article>
                    <p className="eyebrow">Platform</p>
                    <h2>Marketplace, not cafe site.</h2>
                    <p>White space, product grids, and short content blocks keep the experience focused on finding and buying coffee.</p>
                </article>
                <article>
                    <p className="eyebrow">Value</p>
                    <h2>One flow for discovery to checkout.</h2>
                    <p>Seller data, affiliate content, cart, checkout, and reviews stay connected without crowding the public pages.</p>
                </article>
            </section>

            <section className="market-section">
                <div className="section-head">
                    <div>
                        <p className="eyebrow">For Everyone</p>
                        <h2>Three roles, one marketplace</h2>
                    </div>
                </div>
                <div className="how-grid">
                    {steps.map((step, index) => (
                        <article className="how-card" key={step.label}>
                            <span>{index + 1}</span>
                            <p className="eyebrow">{step.label}</p>
                            <h3>{step.title}</h3>
                            <p className="muted">{step.body}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="about-cta-panel">
                <div>
                    <p className="eyebrow">Need help?</p>
                    <h2>Questions about selling, buying, or affiliate content?</h2>
                </div>
                <button className="btn primary" type="button" onClick={() => navigate('contact')}>Contact Coffey</button>
            </section>
        </section>
    );
}
