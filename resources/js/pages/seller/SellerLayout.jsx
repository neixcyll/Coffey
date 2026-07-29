import '../../../css/seller.css';
import { useState } from 'react';
import SellerSidebar from './SellerSidebar.jsx';
import SellerTopbar from './SellerTopbar.jsx';

export default function SellerLayout({
    current,
    navigate,
    user,
    logout,
    sellerNotifications,
    notice,
    children,
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const SellerProfile = user?.seller_profile || user?.SellerProfile || {};
    const storeName = SellerProfile.store_name || user?.name || 'Seller Kopi';

    return (
        <section className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900 font-sans">
            {sidebarOpen && (
                <button 
                    className="fixed inset-0 z-40 bg-black/50 md:hidden" 
                    type="button" 
                    aria-label="Tutup menu seller" 
                    onClick={() => setSidebarOpen(false)} 
                />
            )}
            <div className={`fixed inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64`}>
                <SellerSidebar
                    current={current}
                    navigate={navigate}
                    storeName={storeName}
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                />
            </div>
            
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <SellerTopbar
                    user={user}
                    storeName={storeName}
                    sellerNotifications={sellerNotifications}
                    navigate={navigate}
                    logout={logout}
                    onMenuClick={() => setSidebarOpen(true)}
                />
                <main className="seller-content flex-1 overflow-x-hidden overflow-y-auto">
                    {children}
                </main>
            </div>
        </section>
    );
}
