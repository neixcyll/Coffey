import { useState } from 'react';
import AdminSidebar from './AdminSidebar.jsx';
import AdminTopbar from './AdminTopbar.jsx';

export default function AdminLayout({ current, navigate, user, logout, notice, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <section className="admin-layout">
            {sidebarOpen && <button className="admin-sidebar-overlay" type="button" aria-label="Tutup menu admin" onClick={() => setSidebarOpen(false)} />}
            <AdminSidebar
                current={current}
                navigate={navigate}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="admin-shell">
                <AdminTopbar
                    current={current}
                    user={user}
                    logout={logout}
                    onMenuClick={() => setSidebarOpen(true)}
                />
                <main className="admin-content">
                    {notice && <div className="notice admin-notice">{notice}</div>}
                    {children}
                </main>
            </div>
        </section>
    );
}
