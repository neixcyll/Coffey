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
            <main className={`page public-page ${isAuthPage ? 'auth-public-page' : ''} ${isCatalogPage ? 'catalog-public-page' : ''}`}>{children}</main>
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
        <footer className="public-footer">
            <div>
                <button className="public-footer-brand" type="button" onClick={() => navigate('products')}>
                    <span className="brand-mark">K</span>
                    <strong>Coffey</strong>
                </button>
                <p>Modern coffee marketplace for products, sellers, and creator recommendations.</p>
            </div>
            <nav aria-label="Footer navigation">
                {links.map(([label, view]) => (
                    <button key={view} type="button" onClick={() => navigate(view)}>
                        {label}
                    </button>
                ))}
            </nav>
            <span>Copyright {new Date().getFullYear()} Coffey</span>
        </footer>
    );
}
