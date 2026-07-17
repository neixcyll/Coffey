const adminNavItems = [
    { view: 'admin-dashboard', label: 'Dashboard', icon: DashboardIcon },
    { view: 'admin-users', label: 'Users', icon: UsersIcon },
    { view: 'admin-sellers', label: 'Sellers', icon: StoreIcon },
    { view: 'admin-categories', label: 'Categories', icon: TagsIcon },
    { view: 'admin-products', label: 'Products', icon: BoxIcon },
    { view: 'admin-orders', label: 'Orders', icon: ReceiptIcon },
    { view: 'admin-payments', label: 'Payments', icon: WalletIcon },
    { view: 'admin-content', label: 'Content', icon: FileIcon },
    { view: 'admin-affiliates', label: 'Affiliates', icon: NetworkIcon },
    { view: 'admin-affiliate-commissions', label: 'Commissions', icon: PercentIcon },
    { view: 'admin-reports', label: 'Reports', icon: ChartIcon },
];

export default function AdminSidebar({ current, navigate, open, onClose }) {
    function go(view) {
        navigate(view);
        onClose?.();
    }

    return (
        <aside className={`admin-sidebar ${open ? 'open' : ''} sticky top-0 h-screen flex flex-col gap-6 overflow-y-auto p-6 text-white bg-black border-r border-gray-800`}>
            <nav className="flex flex-col gap-1 mt-4" aria-label="Menu admin">
                {adminNavItems.map(({ view, label, icon: Icon }) => {
                    const isActive = current === view;
                    return (
                        <button
                            key={view}
                            type="button"
                            className={`flex items-center gap-3 w-full text-left py-2 px-3 rounded-lg font-medium text-sm transition-all duration-150 ${
                                isActive 
                                    ? 'bg-white text-black font-semibold' 
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => go(view)}
                        >
                            <span className="w-4 h-4 flex items-center justify-center text-inherit"><Icon /></span>
                            <span>{label}</span>
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}

export function adminTitle(view) {
    return adminNavItems.find((item) => item.view === view)?.label || 'Admin';
}

function DashboardIcon() {
    return (
        <svg className="w-4 h-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="12" width="7" height="9" rx="1" />
            <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
    );
}

function UsersIcon() {
    return (
        <svg className="w-4 h-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
            <path d="M16 3.1a4 4 0 0 1 0 7.8" />
        </svg>
    );
}

function StoreIcon() {
    return (
        <svg className="w-4 h-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
    );
}

function TagsIcon() {
    return (
        <svg className="w-4 h-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
        </svg>
    );
}

function BoxIcon() {
    return (
        <svg className="w-4 h-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
    );
}

function ReceiptIcon() {
    return (
        <svg className="w-4 h-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="10" x2="16" y2="10" />
            <line x1="8" y1="14" x2="16" y2="14" />
            <line x1="8" y1="18" x2="12" y2="18" />
        </svg>
    );
}

function WalletIcon() {
    return (
        <svg className="w-4 h-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
    );
}

function FileIcon() {
    return (
        <svg className="w-4 h-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
        </svg>
    );
}

function NetworkIcon() {
    return (
        <svg className="w-4 h-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    );
}

function PercentIcon() {
    return (
        <svg className="w-4 h-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="5" x2="5" y2="19" />
            <circle cx="6.5" cy="6.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
    );
}

function ChartIcon() {
    return (
        <svg className="w-4 h-4" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
    );
}
