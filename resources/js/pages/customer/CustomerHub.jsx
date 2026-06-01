const customerNavItems = [
    { view: 'orders', label: 'Order Saya', description: 'Pantau pesanan', icon: ReceiptIcon },
    { view: 'affiliate-dashboard', label: 'Affiliate Panel', description: 'Kelola komisi', icon: NetworkIcon },
    { view: 'account-settings', label: 'Pengaturan Akun', description: 'Perbarui profil', icon: AccountIcon },
];

export default function CustomerHub({ current, navigate, user, logout, notice, children }) {
    const activeView = current === 'affiliate-dashboard' || current === 'affiliate-content-upload' || current === 'affiliate-my-content'
        ? 'affiliate-dashboard'
        : current === 'account-settings'
            ? 'account-settings'
            : 'orders';

    return (
        <section className="customer-hub">
            <header className="customer-hub-header">
                <div className="customer-hub-welcome">
                    <button className="customer-hub-brand" type="button" onClick={() => navigate('orders')} aria-label="Customer Hub">
                        <span>K</span>
                    </button>
                    <div>
                        <p className="eyebrow">Customer Hub</p>
                        <h1>Halo, {user?.name || 'Customer Kopi'}</h1>
                        <p>Kelola order, affiliate, dan akun kamu</p>
                    </div>
                </div>

                <div className="customer-hub-actions">
                    <button className="btn ghost customer-hub-shop" type="button" onClick={() => navigate('blog')}>Shop</button>
                    <div className="customer-hub-profile">
                        <span>{initials(user?.name)}</span>
                        <div>
                            <strong>{user?.name || 'Customer Kopi'}</strong>
                            <small>{user?.email || 'Customer account'}</small>
                        </div>
                    </div>
                    <button className="customer-hub-logout" type="button" onClick={() => logout()}>Logout</button>
                </div>
            </header>

            <nav className="customer-hub-nav" aria-label="Menu Customer Hub">
                {customerNavItems.map(({ view, label, description, icon: Icon }) => (
                    <button
                        className={activeView === view ? 'active' : ''}
                        key={view}
                        type="button"
                        aria-current={activeView === view ? 'page' : undefined}
                        onClick={() => navigate(view)}
                    >
                        <Icon />
                        <span>
                            <strong>{label}</strong>
                            <small>{description}</small>
                        </span>
                    </button>
                ))}
            </nav>

            <main className="customer-hub-content">
                {children}
            </main>
        </section>
    );
}

function initials(value) {
    return (value || 'Customer Kopi')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function ReceiptIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-2 2-2-2-2 2-2-2-3 2V5a2 2 0 0 1 2-2Z" />
            <path d="M9 8h6" />
            <path d="M9 12h6" />
            <path d="M9 16h4" />
        </svg>
    );
}

function NetworkIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="12" cy="18" r="3" />
            <path d="M8.6 8.2l2.8 6.1" />
            <path d="M15.4 8.2l-2.8 6.1" />
        </svg>
    );
}

function AccountIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
    );
}
