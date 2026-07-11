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
        <section className="seller-layout">
            {sidebarOpen && <button className="seller-sidebar-overlay" type="button" aria-label="Tutup menu seller" onClick={() => setSidebarOpen(false)} />}
            <SellerSidebar
                current={current}
                navigate={navigate}
                storeName={storeName}
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="seller-shell">
                <SellerTopbar
                    user={user}
                    storeName={storeName}
                    sellerNotifications={sellerNotifications}
                    navigate={navigate}
                    logout={logout}
                    onMenuClick={() => setSidebarOpen(true)}
                />
                <main className="seller-content">
                    {children}
                </main>
            </div>
        </section>
    );
}
