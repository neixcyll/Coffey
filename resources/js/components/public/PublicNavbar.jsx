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
            setScrolled((prev) => { if (!prev && window.scrollY > 80) return true; if (prev && window.scrollY < 20) return false; return prev; });
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
        { key: 'content', view: 'affiliate-content', label: 'Content', icon: <LayersIcon />, active: currentView === 'affiliate-content' },
        { key: 'about', view: 'about', label: 'About', icon: <AboutIcon />, active: currentView === 'about' },
    ];
    const canUseCart = !user || isCustomer;

    return (
        <>
            <div className="navbar-spacer" aria-hidden="true" />
        <header className={`public-navbar ${scrolled ? 'scrolled' : ''} fixed top-0 left-0 z-[100] grid grid-cols-1 md:grid-cols-[200px_1fr_200px] gap-4 items-center w-full bg-[rgba(255,255,255,0.92)] backdrop-blur-md px-6 py-2`}>
            <button className="public-brand inline-flex items-center gap-2.5 bg-transparent border-0 cursor-pointer text-left md:justify-self-start" type="button" onClick={() => go('products')}>
                <img className="brand-mark w-10 h-10 object-contain" src="/logo.png" alt="CoffeS Logo" style={{ background: 'transparent' }} />
                <span className="public-brand-copy">
                    <strong className="font-extrabold text-lg text-[#38291e]">CoffeS</strong>
                </span>
            </button>

            <div className="public-navbar-mobile-actions md:hidden flex items-center gap-2 ml-auto">
                {isCustomer && (
                    <UserNotificationMenu
                        notifications={userNotifications}
                        unreadCount={unreadNotifications}
                        navigate={navigate}
                        onMarkRead={markNotificationRead}
                        onMarkAllRead={markAllNotificationsRead}
                        buttonClassName="cart-header-button public-notification-button flex items-center justify-center w-10 h-10 border border-[#eadfd4] rounded-lg p-0 bg-white"
                    />
                )}
                {canUseCart && <CartButton className="public-mobile-cart-button flex items-center justify-center w-10 h-10 border border-[#eadfd4] rounded-lg p-0 bg-white" cartCount={cartCount} onClick={openCart} />}
                <button className="public-menu-button flex items-center justify-center w-10 h-10 border border-[#eadfd4] rounded-lg p-0 bg-white text-gray-700" type="button" aria-label="Buka menu" onClick={() => setMobileOpen((current) => !current)}>
                    <MenuIcon />
                </button>
            </div>

            <nav className={`public-nav ${mobileOpen ? 'flex' : 'hidden md:flex'} flex-col md:flex-row md:items-center gap-2 md:justify-self-center w-full md:w-auto absolute md:static top-[60px] left-0 bg-white md:bg-transparent p-4 md:p-0 border-b md:border-b-0 border-[#eadfd4]`} aria-label="Navigasi utama">
                {navItems.map((item) => (
                    <button
                        key={item.key}
                        className={`public-nav-item inline-flex items-center gap-2 px-3 py-1.5 border rounded-lg font-bold transition-all text-sm ${
                            item.active 
                                ? 'border-[#d7c4b4] bg-[#fffaf2] text-[#38291e]' 
                                : 'border-transparent text-gray-500 hover:border-[#d7c4b4] hover:bg-[#fffaf2] hover:text-[#38291e]'
                        }`}
                        type="button"
                        onClick={() => item.onClick ? item.onClick() : go(item.view)}
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </button>
                ))}
                <form className="public-nav-search flex items-center gap-2 px-3 py-1.5 border border-[#d8cbbc] rounded-lg bg-white focus-within:ring-2 focus-within:ring-[#5b3825] focus-within:border-transparent transition-all w-full md:w-[220px] ml-0 md:ml-1" role="search" onSubmit={submitSearch}>
                    <SearchIcon />
                    <input
                        aria-label="Search coffee products"
                        placeholder="Search coffee"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        className="bg-transparent border-0 p-0 text-sm focus:outline-none focus:ring-0 text-[#261c15] w-full"
                    />
                </form>
            </nav>

            <div className="flex items-center gap-4 hidden md:flex md:justify-self-end">
                    <div className="flex items-center justify-end gap-2 flex-row">
                        {isCustomer && (
                            <UserNotificationMenu
                                notifications={userNotifications}
                                unreadCount={unreadNotifications}
                                navigate={navigate}
                                onMarkRead={markNotificationRead}
                                onMarkAllRead={markAllNotificationsRead}
                                buttonClassName="cart-header-button public-notification-button public-desktop-notification-button flex items-center justify-center w-10 h-10 border border-[#eadfd4] rounded-lg p-0 bg-white"
                            />
                        )}
                        {canUseCart && <CartButton className="public-desktop-cart-button flex items-center justify-center w-10 h-10 border border-[#eadfd4] rounded-lg p-0 bg-white" cartCount={cartCount} onClick={openCart} />}
    
                        {user ? (
                            <button
                                className="flex items-center justify-center w-10 h-10 border border-[#eadfd4] rounded-lg bg-white hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                                type="button"
                                title="Dashboard"
                                aria-label="Dashboard"
                                onClick={() => go(getDashboardView(role))}
                            >
                                <UserIcon />
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 flex-row">
                                <button className="btn ghost whitespace-nowrap" type="button" onClick={() => go('login')}>Login</button>
                                <button className="btn primary whitespace-nowrap" type="button" onClick={() => go('register')}>Register</button>
                            </div>
                        )}
                    </div>
                </div>
        </header>
        </>
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
            { view: 'seller-products', label: 'Products Saya' },
            { view: 'seller-orders', label: 'Order Masuk' },
        ];
    }

    return [
        { view: 'orders', label: 'Order Saya' },
        { view: 'affiliate-dashboard', label: 'Affiliate Panel' },
        { view: 'account-settings', label: 'Settings Akun' },
    ];
}

function roleLabel(role) {
    if (role === 'admin') return 'Admin';
    if (role === 'seller') return 'Seller';
    if (role === 'affiliate') return 'Affiliate';
    if (role === 'customer') return 'Customer';

    return 'Account';
}

function getDashboardView(role) {
    if (role === 'admin') return 'admin-dashboard';
    if (role === 'seller') return 'seller-dashboard';
    if (role === 'affiliate') return 'affiliate-dashboard';
    return 'orders'; // Default for customer
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
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16" />
            <path d="M4 12h16" />
            <path d="M4 17h16" />
        </svg>
    );
}

function HomeIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m3 11 9-8 9 8" />
            <path d="M5 10v10h14V10" />
            <path d="M9 20v-6h6v6" />
        </svg>
    );
}

function ShopIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9h18" />
            <path d="m5 9 1-5h12l1 5" />
            <path d="M5 9v11h14V9" />
            <path d="M9 20v-6h6v6" />
        </svg>
    );
}

function RoasterIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 10h16" />
            <path d="M6 10v10h12V10" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            <path d="M9 15h6" />
        </svg>
    );
}

function LayersIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="m3 12 9 5 9-5" />
            <path d="m3 16 9 5 9-5" />
        </svg>
    );
}

function AboutIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" />
            <path d="M12 8h.01" />
        </svg>
    );
}

function ContactIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h16v14H4z" />
            <path d="m4 7 8 6 8-6" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </svg>
    );
}

function ChevronDownIcon() {
    return (
        <svg className="public-account-chevron" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m7 10 5 5 5-5" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
}
