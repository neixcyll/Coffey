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
        <aside className={`admin-sidebar ${open ? 'open' : ''} sticky top-0 h-screen flex flex-col gap-4.5 overflow-y-auto p-5 text-[#fdf8f0] bg-[#2b1b13] shadow-[18px_0_48px_rgba(38,28,21,0.18)]`}>
            <div className="admin-sidebar-brand grid gap-3">
                <button className="admin-logo inline-flex items-center gap-2.5 border-0 p-0 text-left bg-transparent cursor-pointer" type="button" onClick={() => go('admin-dashboard')} aria-label="Dashboard Admin">
                    <img className="admin-logo-mark w-[38px] h-[38px] object-contain" src="/logo.png" alt="Admin Logo" style={{ background: 'transparent' }} />
                    <span className="flex flex-col text-left">
                        <strong className="block text-[#fffdfa] font-extrabold leading-tight">Marketplace Kopi</strong>
                        <small className="block text-[#a08a75] text-xs">Admin Panel</small>
                    </span>
                </button>
                <span className="admin-panel-badge self-start bg-[#5b3825] text-white text-[0.74rem] font-bold px-2 py-0.5 rounded-full">Admin Panel</span>
            </div>

            <nav className="admin-nav grid gap-1 mt-2" aria-label="Menu admin">
                {adminNavItems.map(({ view, label, icon: Icon }) => {
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

export function adminTitle(view) {
    return adminNavItems.find((item) => item.view === view)?.label || 'Admin';
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

function UsersIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
            <path d="M16 3.1a4 4 0 0 1 0 7.8" />
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

function TagsIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
            <circle cx="8" cy="8" r="1.5" />
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

function WalletIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7a2 2 0 0 1 2-2h14v14H5a2 2 0 0 1-2-2V7Z" />
            <path d="M17 12h4v5h-4a2.5 2.5 0 0 1 0-5Z" />
        </svg>
    );
}

function FileIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
            <path d="M14 2v6h6" />
            <path d="M8 13h8" />
            <path d="M8 17h6" />
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

function PercentIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 5L5 19" />
            <circle cx="7" cy="7" r="2" />
            <circle cx="17" cy="17" r="2" />
        </svg>
    );
}

function ChartIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" />
            <path d="M7 15l4-4 3 3 5-7" />
        </svg>
    );
}
