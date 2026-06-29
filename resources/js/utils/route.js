import { ADMIN_ROUTE_MAP, PUBLIC_ROUTE_MAP, SELLER_ROUTE_MAP } from '../constants/options.js';

export function parseHashRoute() {
    const raw = window.location.hash.replace('#', '') || 'products';
    const [path] = raw.split('?');
    const [view, id] = path.split('/');
    return { view, id };
}

export function parsePathRoute() {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const parts = path.split('/').filter(Boolean);
    const sellerPathMap = {
        profile: 'seller-profile',
        products: 'seller-products',
        orders: 'seller-orders',
        reviews: 'seller-reviews',
    };
    const adminPathMap = {
        users: 'admin-users',
        sellers: 'admin-sellers',
        categories: 'admin-categories',
        products: 'admin-products',
        orders: 'admin-orders',
        payments: 'admin-payments',
        content: 'admin-content',
        affiliates: 'admin-affiliates',
        commissions: 'admin-affiliate-commissions',
        reports: 'admin-reports',
    };

    if (path === 'blog' || path === 'explore') return { view: 'blog' };
    if (path === 'login') return { view: 'login' };
    if (path === 'register') return { view: 'register' };
    if (path === 'about') return { view: 'about' };
    if (path === 'contact') return { view: 'contact' };
    if (parts[0] === 'blog' && parts[1]) return { view: 'blog-detail', id: parts[1] };
    if (path === 'review') return { view: 'review' };
    if (path === 'brewing-guide') return { view: 'brewing-guide' };
    if (path === 'compare') return { view: 'compare' };
    if (path === 'deals') return { view: 'deals' };
    if (parts[0] === 'creator' && parts[1]) return { view: 'creator', id: parts[1] };
    if (parts[0] === 'product' && parts[1]) return { view: 'product', id: parts[1] };
    if (path === 'seller' || path === 'seller/dashboard') return { view: 'seller-dashboard' };
    if (parts[0] === 'seller' && parts[1] === 'orders' && parts[2] && parts[3] === 'print') return { view: 'seller-order-print', id: parts[2] };
    if (parts[0] === 'seller' && sellerPathMap[parts[1]]) return { view: sellerPathMap[parts[1]] };
    if (path === 'admin-dashboard') return { view: 'admin-dashboard' };
    if (parts[0] === 'admin' && adminPathMap[parts[1]]) return { view: adminPathMap[parts[1]] };

    return null;
}

export function parseRoute() {
    return parsePathRoute() || parseHashRoute();
}

export function publicPathFor(view, id) {
    if (PUBLIC_ROUTE_MAP[view]) return PUBLIC_ROUTE_MAP[view];
    if (SELLER_ROUTE_MAP[view]) return SELLER_ROUTE_MAP[view];
    if (ADMIN_ROUTE_MAP[view]) return ADMIN_ROUTE_MAP[view];
    if (view === 'blog-detail' && id) return `/blog/${id}`;
    if (view === 'creator' && id) return `/creator/${id}`;
    if (view === 'product' && id) return `/product/${id}`;
    if (view === 'seller-order-print' && id) return `/seller/orders/${id}/print`;

    return null;
}

export function affiliateRefFromUrl() {
    const searchRef = new URLSearchParams(window.location.search).get('ref');
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const hashRef = new URLSearchParams(hashQuery).get('ref');

    return (searchRef || hashRef || '').trim();
}

export function roleName(user) {
    return user?.role?.name;
}

export function defaultLandingFor(user) {
    const role = roleName(user);

    if (role === 'seller' && user?.seller_profile?.status === 'active') return 'seller-dashboard';
    if (role === 'admin') return 'admin-dashboard';

    return 'products';
}

export function canOpenAfterLogin(view, user) {
    const role = roleName(user);

    if (!view) return false;
    if (['affiliate-dashboard', 'affiliate-content-upload', 'affiliate-my-content', 'account-settings', 'cart', 'checkout', 'orders', 'user-dashboard'].includes(view)) return role === 'customer';
    if (view.startsWith('seller-')) return role === 'seller';
    if (view.startsWith('admin-')) return role === 'admin';

    return true;
}

export function rememberCurrentRoute() {
    const pathRoute = parsePathRoute();
    const current = pathRoute ? `${pathRoute.view}${pathRoute.id ? `/${pathRoute.id}` : ''}` : window.location.hash.replace('#', '') || 'products';
    sessionStorage.setItem('post_login_redirect', current);
}
