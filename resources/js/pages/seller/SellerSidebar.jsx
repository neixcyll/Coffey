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
        <aside className={`seller-sidebar ${open ? 'open' : ''} sticky top-0 h-screen flex flex-col gap-4.5 overflow-y-auto p-5 text-[#fdf8f0] bg-[#2b1b13] shadow-[18px_0_48px_rgba(38,28,21,0.18)]`}>
            <div className="seller-sidebar-brand grid gap-3">
                <button className="seller-logo inline-flex items-center gap-2.5 border-0 p-0 text-left bg-transparent cursor-pointer" onClick={() => go('seller-dashboard')} aria-label="Dashboard Seller">
                    <img className="seller-logo-mark w-[38px] h-[38px] object-contain" src="/logo.png" alt="Seller Logo" style={{ background: 'transparent' }} />
                    <span className="flex flex-col text-left">
                        <strong className="block text-[#fffdfa] font-extrabold leading-tight">Marketplace Kopi</strong>
                        <small className="block text-[#a08a75] text-xs">Seller Panel</small>
                    </span>
                </button>
                <span className="seller-panel-badge self-start bg-[#5b3825] text-white text-[0.74rem] font-bold px-2 py-0.5 rounded-full">Seller Panel</span>
            </div>

            <div className="seller-store-card flex items-center gap-3 border border-[rgba(255,253,250,0.12)] rounded-xl p-3 bg-[rgba(255,253,250,0.04)]">
                <span className="seller-store-avatar w-10 h-10 rounded-lg flex items-center justify-center bg-[#5b3825] text-white font-extrabold text-sm flex-shrink-0">{initials(storeName)}</span>
                <span className="flex flex-col text-xs text-left">
                    <small className="text-[#a08a75]">Nama toko</small>
                    <strong className="text-white text-sm font-extrabold truncate max-w-[150px]">{storeName || 'Seller Kopi'}</strong>
                </span>
            </div>

            <nav className="seller-nav grid gap-1 mt-2" aria-label="Menu seller">
                {sellerNavItems.map(({ view, label, icon: Icon }) => {
                    const isActive = current === view;
                    return (
                        <button
                            key={view}
                            type="button"
                            className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg font-bold text-sm bg-transparent border-0 cursor-pointer transition-colors ${
                                isActive 
                                    ? 'active bg-[#5b3825] text-[#fff]' 
                                    : 'text-[#d7c4b4] hover:bg-[rgba(255,253,250,0.06)] hover:text-[#fff]'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => go(view)}
                        >
                            <span className="w-5 h-5 flex items-center justify-center text-inherit"><Icon /></span>
                            <span>{label}</span>
                        </button>
                    );
                })}
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
