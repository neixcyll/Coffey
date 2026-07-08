import { useEffect, useState } from 'react';
import CartDrawer from './CartDrawer.jsx';
import PublicNavbar from './PublicNavbar.jsx';

export default function PublicLayout({
    token,
    user,
    navigate,
    logout,
    currentView,
    cartCount,
    userNotifications,
    unreadNotifications,
    notice,
    setNotice,
    refreshCartCount,
    markNotificationRead,
    markAllNotificationsRead,
    children,
}) {
    const [cartOpen, setCartOpen] = useState(false);
    const isAuthPage = ['login', 'register'].includes(currentView);
    const isCatalogPage = currentView === 'products';

    useEffect(() => {
        if (currentView === 'cart') setCartOpen(true);
    }, [currentView]);

    return (
        <div className={`public-layout ${isAuthPage ? 'auth-site-layout' : ''}`}>
            <PublicNavbar
                user={user}
                navigate={navigate}
                logout={logout}
                currentView={currentView}
                cartCount={cartCount}
                userNotifications={userNotifications}
                unreadNotifications={unreadNotifications}
                markNotificationRead={markNotificationRead}
                markAllNotificationsRead={markAllNotificationsRead}
                onCartClick={() => setCartOpen(true)}
            />
            <main className={`page public-page py-7 ${isAuthPage ? 'auth-public-page' : ''} ${isCatalogPage ? 'catalog-public-page' : ''}`}>{children}</main>
            {!isAuthPage && <PublicFooter navigate={navigate} />}
            <CartDrawer
                open={cartOpen}
                onClose={() => setCartOpen(false)}
                token={token}
                user={user}
                navigate={navigate}
                setNotice={setNotice}
                refreshCartCount={refreshCartCount}
            />
        </div>
    );
}

function PublicFooter({ navigate }) {
    const links = [
        ['Shop', 'blog'],
        ['Content', 'affiliate-content'],
        ['About', 'about'],
        ['Contact', 'contact'],
    ];

    return (
        <footer className="public-footer grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_auto] gap-7 items-center w-[min(1280px,calc(100%-32px))] mx-auto mt-6 md:mt-11 border-t border-[#eadfd4] pt-6 pb-9 text-gray-500">
            <div>
                <button className="public-footer-brand inline-flex gap-2.5 items-center border-0 p-0 text-gray-900 bg-transparent cursor-pointer" type="button" onClick={() => navigate('products')}>
                    <img className="brand-mark w-9 h-9 object-contain" src="/logo.png" alt="Coffey Logo" style={{ background: 'transparent' }} />
                    <strong className="font-extrabold text-lg text-[#38291e]">Coffey</strong>
                </button>
                <p className="max-w-[380px] mt-2.5 text-sm text-gray-500 leading-relaxed">Modern coffee marketplace for products, sellers, and creator recommendations.</p>
            </div>
            <nav aria-label="Footer navigation" className="flex flex-wrap gap-2">
                {links.map(([label, view]) => (
                    <button key={view} type="button" onClick={() => navigate(view)} className="border-0 px-2.5 py-2 font-bold text-gray-500 hover:text-gray-900 bg-transparent transition-colors cursor-pointer">
                        {label}
                    </button>
                ))}
            </nav>
            <span className="text-xs text-gray-400">Copyright {new Date().getFullYear()} Coffey</span>
        </footer>
    );
}
