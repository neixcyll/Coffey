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
    notice,
    setNotice,
    refreshCartCount,
    children,
}) {
    const [cartOpen, setCartOpen] = useState(false);
    const isAuthPage = ['login', 'register'].includes(currentView);

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
                onCartClick={() => setCartOpen(true)}
            />
            <main className={`page public-page ${isAuthPage ? 'auth-public-page' : ''}`}>{children}</main>
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
