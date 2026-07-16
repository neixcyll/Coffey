const sellerNavItems = [
    { view: 'seller-dashboard', label: 'Dashboard', icon: DashboardIcon },
    { view: 'seller-products', label: 'Products', icon: BoxIcon },
    { view: 'seller-orders', label: 'Orders', icon: ReceiptIcon },
    { view: 'seller-reviews', label: 'Reviews', icon: StarIcon },
    { view: 'seller-profile', label: 'Store Profile', icon: StoreIcon },
];

export default function SellerSidebar({ current, navigate, storeName, open, onClose }) {
    function go(view) {
        navigate(view);
        onClose?.();
    }

    return (
        <aside className="h-full flex flex-col bg-white border-r border-gray-200 w-full overflow-y-auto">
            <div className="p-5 flex flex-col gap-5">
                <button 
                    className="flex items-center gap-3 border-0 bg-transparent p-0 text-left cursor-pointer group" 
                    onClick={() => go('seller-dashboard')} 
                    aria-label="Dashboard Seller"
                >
                    <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-gray-800 transition-colors">
                        M
                    </div>
                    <span className="flex flex-col">
                        <strong className="text-gray-900 font-extrabold text-base leading-tight tracking-tight">Marketplace</strong>
                        <small className="text-gray-500 text-xs font-medium tracking-wide uppercase mt-0.5">Seller Center</small>
                    </span>
                </button>

                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                    <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-gray-200 text-gray-700 font-bold text-xs flex-shrink-0">
                        {initials(storeName)}
                    </span>
                    <span className="flex flex-col text-left overflow-hidden">
                        <small className="text-gray-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Toko Aktif</small>
                        <strong className="text-gray-900 text-sm font-bold truncate">{storeName || 'Seller'}</strong>
                    </span>
                </div>
            </div>

            <nav className="flex-1 px-3 pb-5 flex flex-col gap-1" aria-label="Menu seller">
                {sellerNavItems.map(({ view, label, icon: Icon }) => {
                    const isActive = current === view;
                    return (
                        <button
                            key={view}
                            type="button"
                            className={`flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                                isActive 
                                    ? 'bg-black text-white shadow-md shadow-black/10' 
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => go(view)}
                        >
                            <span className="w-5 h-5 flex items-center justify-center"><Icon /></span>
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
            <rect x="3" y="3" width="7" height="9" rx="1.5" />
            <rect x="14" y="3" width="7" height="5" rx="1.5" />
            <rect x="14" y="12" width="7" height="9" rx="1.5" />
            <rect x="3" y="16" width="7" height="5" rx="1.5" />
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
