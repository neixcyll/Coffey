import { useEffect, useState } from 'react';
import { roleName } from '../../utils/route.js';
import { CartIcon } from '../common/Header.jsx';
import UserNotificationMenu from '../common/UserNotificationMenu.jsx';

export default function PublicNavbar({
    user,
    navigate,
    logout,
    currentView,
    cartCount,
    userNotifications,
    unreadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    onCartClick,
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const role = roleName(user);
    const isCustomer = role === 'customer';

    useEffect(() => {
        function updateScrollState() {
            setScrolled(window.scrollY > 28);
        }

        updateScrollState();
        window.addEventListener('scroll', updateScrollState, { passive: true });

        return () => window.removeEventListener('scroll', updateScrollState);
    }, []);

    function go(view, id) {
        navigate(view, id);
        setMobileOpen(false);
        setAccountOpen(false);
    }

    function openCart() {
        setMobileOpen(false);
        setAccountOpen(false);
        onCartClick();
    }

    function submitSearch(event) {
        event.preventDefault();
        const keyword = search.trim();

        if (keyword) sessionStorage.setItem('explore_search', keyword);

        go('blog');
    }

    function scrollToHomeSection(id) {
        setMobileOpen(false);
        setAccountOpen(false);
        navigate('products');
        window.setTimeout(() => {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
    }

    const navItems = [
        { key: 'home', view: 'products', label: 'Home', icon: <HomeIcon />, active: currentView === 'products' },
        { key: 'shop', view: 'blog', label: 'Shop', icon: <ShopIcon />, active: ['blog', 'product', 'review', 'brewing-guide', 'compare', 'blog-detail', 'creator'].includes(currentView) },
        { key: 'roasters', label: 'Roasters', icon: <RoasterIcon />, active: false, onClick: () => scrollToHomeSection('home-roasters') },
        { key: 'content', view: 'affiliate-content', label: 'Content', icon: <LayersIcon />, active: currentView === 'affiliate-content' },
        { key: 'about', view: 'about', label: 'About', icon: <AboutIcon />, active: currentView === 'about' },
    ];
    const canUseCart = !user || isCustomer;

    return (
        <header className={`public-navbar ${scrolled ? 'scrolled' : ''}`}>
            <button className="public-brand" type="button" onClick={() => go('products')}>
                <span className="brand-mark">K</span>
                <span className="public-brand-copy">
                    <strong>Coffey</strong>
                </span>
            </button>

            <div className="public-navbar-mobile-actions">
                {isCustomer && (
                    <UserNotificationMenu
                        notifications={userNotifications}
                        unreadCount={unreadNotifications}
                        navigate={navigate}
                        onMarkRead={markNotificationRead}
                        onMarkAllRead={markAllNotificationsRead}
                        buttonClassName="cart-header-button public-notification-button"
                    />
                )}
                {canUseCart && <CartButton className="public-mobile-cart-button" cartCount={cartCount} onClick={openCart} />}
                <button className="public-menu-button" type="button" aria-label="Buka menu" onClick={() => setMobileOpen((current) => !current)}>
                    <MenuIcon />
                </button>
            </div>

            <div className={`public-nav-panel ${mobileOpen ? 'open' : ''}`}>
                <nav className="public-nav" aria-label="Navigasi utama">
                    {navItems.map((item) => (
                        <button
                            key={item.key}
                            className={`public-nav-item ${item.featured ? 'featured' : ''} ${item.active ? 'active' : ''}`}
                            type="button"
                            onClick={() => item.onClick ? item.onClick() : go(item.view)}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <form className="public-nav-search" role="search" onSubmit={submitSearch}>
                    <SearchIcon />
                    <input
                        aria-label="Search coffee products"
                        placeholder="Search coffee"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </form>

                <div className="public-account">
                    {isCustomer && (
                        <UserNotificationMenu
                            notifications={userNotifications}
                            unreadCount={unreadNotifications}
                            navigate={navigate}
                            onMarkRead={markNotificationRead}
                            onMarkAllRead={markAllNotificationsRead}
                            buttonClassName="cart-header-button public-notification-button public-desktop-notification-button"
                        />
                    )}
                    {canUseCart && <CartButton className="public-desktop-cart-button" cartCount={cartCount} onClick={openCart} />}

                    {user ? (
                        <div className="public-account-menu">
                            <button
                                className="public-account-button"
                                type="button"
                                aria-expanded={accountOpen}
                                aria-label="Buka menu akun"
                                onClick={() => setAccountOpen((current) => !current)}
                            >
                                <span className="public-account-avatar">{initials(user.name)}</span>
                                <span className="public-account-copy">
                                    <strong>{user.name}</strong>
                                    <small>{roleLabel(role)}</small>
                                </span>
                                <ChevronDownIcon />
                            </button>
                            {accountOpen && (
                                <div className="public-account-dropdown">
                                    {accountLinks(role).map((item) => (
                                        <button key={item.view} type="button" onClick={() => go(item.view)}>
                                            {item.label}
                                        </button>
                                    ))}
                                    <button type="button" onClick={() => { setAccountOpen(false); setMobileOpen(false); logout(); }}>Logout</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="row">
                            <button className="btn ghost" type="button" onClick={() => go('login')}>Login</button>
                            <button className="btn primary" type="button" onClick={() => go('register')}>Register</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

function CartButton({ className = '', cartCount, onClick }) {
    return (
        <button className={`cart-header-button public-cart-button ${className}`} title="Cart" aria-label={`Cart ${cartCount || 0} item`} type="button" onClick={onClick}>
            <CartIcon />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
    );
}

function accountLinks(role) {
    if (role === 'admin') return [{ view: 'admin-dashboard', label: 'Admin Panel' }];
    if (role === 'affiliate') {
        return [
            { view: 'affiliate-dashboard', label: 'Affiliate Panel' },
            { view: 'affiliate-content', label: 'Content Layer' },
        ];
    }
    if (role === 'seller') {
        return [
            { view: 'seller-dashboard', label: 'Seller Panel' },
            { view: 'seller-products', label: 'Produk Saya' },
            { view: 'seller-orders', label: 'Order Masuk' },
        ];
    }

    return [
        { view: 'orders', label: 'Order Saya' },
        { view: 'affiliate-dashboard', label: 'Affiliate Panel' },
        { view: 'account-settings', label: 'Pengaturan Akun' },
    ];
}

function roleLabel(role) {
    if (role === 'admin') return 'Admin';
    if (role === 'seller') return 'Seller';
    if (role === 'affiliate') return 'Affiliate';
    if (role === 'customer') return 'Customer';

    return 'Account';
}

function initials(value) {
    return (value || 'Kopi')
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

function HomeIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 11 9-8 9 8" />
            <path d="M5 10v10h14V10" />
            <path d="M9 20v-6h6v6" />
        </svg>
    );
}

function ShopIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9h18" />
            <path d="m5 9 1-5h12l1 5" />
            <path d="M5 9v11h14V9" />
            <path d="M9 20v-6h6v6" />
        </svg>
    );
}

function RoasterIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10h16" />
            <path d="M6 10v10h12V10" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            <path d="M9 15h6" />
        </svg>
    );
}

function LayersIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="m3 12 9 5 9-5" />
            <path d="m3 16 9 5 9-5" />
        </svg>
    );
}

function AboutIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" />
            <path d="M12 8h.01" />
        </svg>
    );
}

function ContactIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h16v14H4z" />
            <path d="m4 7 8 6 8-6" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}

function ChevronDownIcon() {
    return (
        <svg className="public-account-chevron" aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m7 10 5 5 5-5" />
        </svg>
    );
}
