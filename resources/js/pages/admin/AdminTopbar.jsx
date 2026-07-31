import { adminTitle } from './AdminSidebar.jsx';

export default function AdminTopbar({ current, user, logout, onMenuClick }) {
    const title = adminTitle(current);

    return (
        <header className="h-16 border-b-2 border-[#7e3f25] bg-[#9c4f2e] flex items-center justify-between px-6 z-30">
            <div className="flex items-center gap-4">
                <button className="md:hidden text-white/80 hover:text-white" type="button" onClick={onMenuClick} aria-label="Buka menu admin">
                    <MenuIcon />
                </button>
                <div className="flex flex-col">
                    <strong className="text-lg font-semibold text-white tracking-tight">{title}</strong>
                    <small className="text-xs text-white/70">Marketplace Console</small>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button
                    className="text-sm font-bold px-5 py-2 bg-white text-[#7e3f25] rounded-lg hover:bg-white/90 transition-colors shadow-sm"
                    type="button"
                    onClick={() => navigate('blog')}
                >
                    Explore
                </button>

                <button className="relative p-1 text-white/75 hover:text-white transition-colors" type="button" title="Notifikasi admin" aria-label="Notifikasi admin">
                    <BellIcon />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-white rounded-full ring-2 ring-[#9c4f2e]" />
                </button>

                <div className="h-8 w-px bg-white/25" />

                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-white text-[#7e3f25] flex items-center justify-center text-sm font-bold font-mono">
                        {initials(user?.name)}
                    </div>
                    <div className="hidden sm:flex flex-col text-left">
                        <strong className="text-sm font-bold text-white leading-none">{user?.name || 'Admin'}</strong>
                        <small className="text-xs text-white/60 mt-0.5">Administrator</small>
                    </div>
                </div>

                <button 
                    className="text-sm font-semibold px-4 py-2 border border-white/40 text-white rounded-md hover:bg-[#7e3f25] transition-colors" 
                    type="button" 
                    onClick={() => logout()}
                >
                    Logout
                </button>
            </div>
        </header>
    );
}

function initials(value) {
    return (value || 'Admin')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function MenuIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
        </svg>
    );
}

function BellIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    );
}
