const sellerNavItems = [
    { view: 'seller-dashboard', label: 'Dashboard', icon: DashboardIcon },
    { view: 'seller-profile', label: 'Store Profile', icon: StoreIcon },
    { view: 'seller-products', label: 'Products', icon: BoxIcon },
    { view: 'seller-orders', label: 'Orders', icon: ReceiptIcon },
    { view: 'seller-reviews', label: 'Reviews', icon: StarIcon },
];

export default function SellerSidebar({ current, navigate, storeName, open, onClose }) {
    function go(view) {
        navigate(view);
        onClose?.();
    }

    return (
        <aside className={`seller-sidebar ${open ? 'open' : ''}`}>
            <div className="seller-sidebar-brand">
                <button className="seller-logo" onClick={() => go('seller-dashboard')} aria-label="Dashboard Seller">
                    <span className="seller-logo-mark">K</span>
                    <span>
                        <strong>Marketplace Kopi</strong>
                        <small>Seller Panel</small>
                    </span>
                </button>
                <span className="seller-panel-badge">Seller Panel</span>
            </div>

            <div className="seller-store-card">
                <span className="seller-store-avatar">{initials(storeName)}</span>
                <span>
                    <small>Nama toko</small>
                    <strong>{storeName || 'Seller Kopi'}</strong>
                </span>
            </div>

            <nav className="seller-nav" aria-label="Menu seller">
                {sellerNavItems.map(({ view, label, icon: Icon }) => (
                    <button
                        key={view}
                        type="button"
                        className={current === view ? 'active' : ''}
                        aria-current={current === view ? 'page' : undefined}
                        onClick={() => go(view)}
                    >
                        <Icon />
                        <span>{label}</span>
                    </button>
                ))}
            </nav>
        </aside>
    );
}

function initials(value) {
    return (value || 'Seller')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function DashboardIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="8" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="15" width="7" height="6" rx="1.5" />
        </svg>
    );
}

function StoreIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10h16" />
            <path d="M5 10l1-5h12l1 5" />
            <path d="M6 10v9h12v-9" />
            <path d="M9 19v-5h6v5" />
        </svg>
    );
}

function BoxIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8l-9-5-9 5 9 5 9-5Z" />
            <path d="M3 8v8l9 5 9-5V8" />
            <path d="M12 13v8" />
        </svg>
    );
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

function StarIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z" />
        </svg>
    );
}
