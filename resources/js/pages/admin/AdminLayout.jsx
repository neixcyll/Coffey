import { useState } from 'react';
import AdminSidebar from './AdminSidebar.jsx';
import AdminTopbar from './AdminTopbar.jsx';

export default function AdminLayout({ current, navigate, user, logout, notice, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <section className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900 font-sans">
            {sidebarOpen && (
                <button 
                    className="fixed inset-0 z-40 bg-black/50 md:hidden" 
                    type="button" 
                    aria-label="Tutup menu admin" 
                    onClick={() => setSidebarOpen(false)} 
                />
            )}
            <div className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-[#0a0a0a]`}>
                <AdminSidebar
                    current={current}
                    navigate={navigate}
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
            </div>
            
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AdminTopbar
                    current={current}
                    user={user}
                    logout={logout}
                    onMenuClick={() => setSidebarOpen(true)}
                />
                <main className="admin-content flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </section>
    );
}
