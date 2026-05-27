import { adminTitle } from './AdminSidebar.jsx';

export default function AdminTopbar({ current, user, logout, onMenuClick }) {
    const title = adminTitle(current);

    return (
        <header className="admin-topbar">
            <button className="admin-menu-button" type="button" onClick={onMenuClick} aria-label="Buka menu admin">
                <MenuIcon />
            </button>

            <div className="admin-topbar-title">
                <strong>{title}</strong>
                <small>Marketplace Kopi internal control</small>
            </div>

            <div className="admin-topbar-actions">
                <button className="admin-icon-button" type="button" title="Notifikasi admin" aria-label="Notifikasi admin">
                    <BellIcon />
                </button>

                <div className="admin-account-chip">
                    <span className="admin-account-avatar">{initials(user?.name)}</span>
                    <span>
                        <strong>{user?.name || 'Admin'}</strong>
                        <small>Administrator</small>
                    </span>
                </div>

                <button className="btn ghost admin-logout-button" type="button" onClick={() => logout()}>Logout</button>
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
