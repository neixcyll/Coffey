import { useEffect } from 'react';

const steps = [
    {
        label: 'Customer',
        title: 'Discover and buy',
        body: 'Browse curated coffee, choose variants, and checkout without leaving the flow.',
    },
    {
        label: 'Seller',
        title: 'List and manage',
        body: 'Local roasters manage products, orders, stock, and customer reviews from one dashboard.',
    },
    {
        label: 'Affiliate',
        title: 'Share and earn',
        body: 'Creators share products and content links, then track clicks and commissions from their panel.',
    },
];

const features = [
    'Curated local coffee products',
    'Variant-aware cart and checkout',
    'Seller tools for catalog and orders',
    'Affiliate links and content tracking',
    'Review flow for verified purchases',
    'Consistent dashboards for operations',
];

export default function AboutPage({ navigate, focusContact = false }) {
    useEffect(() => {
        if (!focusContact) return;

        window.requestAnimationFrame(() => {
            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }, [focusContact]);

    return (
        <section className="about-page">
            <header className="about-hero">
                <div>
                    <p className="eyebrow">About Marketplace Kopi</p>
                    <h1>A focused coffee marketplace for buyers, roasters, and creators.</h1>
                    <p>
                        Marketplace Kopi exists to make Indonesian coffee easier to discover, sell, and recommend through one connected ecommerce and affiliate platform.
                    </p>
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
                    <p className="eyebrow">Our Story</p>
                    <h2>Built around local coffee discovery</h2>
                    <p>
                        Many local coffee businesses have strong products but fragmented sales, content, and affiliate workflows. This platform brings those pieces together so customers can move from discovery to checkout with fewer steps.
                    </p>
                </article>
                <article>
                    <p className="eyebrow">Mission</p>
                    <h2>Support sellers and affiliate creators</h2>
                    <p>
                        We help roasters present products clearly, help customers choose quickly, and help creators recommend coffee with trackable links and transparent commission data.
                    </p>
                </article>
            </section>

            <section className="market-section">
                <div className="section-head">
                    <div>
                        <p className="eyebrow">How It Works</p>
                        <h2>One ecosystem, three paths</h2>
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

            <section className="about-feature-grid">
                <div>
                    <p className="eyebrow">Platform Features</p>
                    <h2>Designed for conversion and repeat operations</h2>
                </div>
                <div className="feature-list">
                    {features.map((feature) => (
                        <span key={feature}>{feature}</span>
                    ))}
                </div>
            </section>

            <section className="contact-grid" id="contact">
                <div>
                    <p className="eyebrow">Contact</p>
                    <h2>Talk to Marketplace Kopi</h2>
                    <p className="muted">For seller onboarding, affiliate support, and platform partnerships.</p>
                </div>
                <div className="contact-card-grid">
                    <ContactCard label="Email" value="hello@marketplacekopi.test" />
                    <ContactCard label="WhatsApp" value="+62 812-3456-7890" />
                    <ContactCard label="Instagram" value="@marketplacekopi" />
                    <ContactCard label="Website" value="marketplacekopi.test" />
                </div>
            </section>
        </section>
    );
}

function ContactCard({ label, value }) {
    return (
        <article className="contact-card">
            <span>{label}</span>
            <strong>{value}</strong>
        </article>
    );
}
