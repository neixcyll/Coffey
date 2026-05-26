import { PUBLIC_ROUTE_MAP } from '../constants/options.js';

export function parseHashRoute() {
    const raw = window.location.hash.replace('#', '') || 'products';
    const [path] = raw.split('?');
    const [view, id] = path.split('/');
    return { view, id };
}

export function parsePathRoute() {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    const parts = path.split('/').filter(Boolean);

    if (path === 'blog') return { view: 'blog' };
    if (parts[0] === 'blog' && parts[1]) return { view: 'blog-detail', id: parts[1] };
    if (path === 'review') return { view: 'review' };
    if (path === 'brewing-guide') return { view: 'brewing-guide' };
    if (path === 'compare') return { view: 'compare' };
    if (parts[0] === 'creator' && parts[1]) return { view: 'creator', id: parts[1] };
    if (parts[0] === 'product' && parts[1]) return { view: 'product', id: parts[1] };

    return null;
}

export function parseRoute() {
    return parsePathRoute() || parseHashRoute();
}

export function publicPathFor(view, id) {
    if (PUBLIC_ROUTE_MAP[view]) return PUBLIC_ROUTE_MAP[view];
    if (view === 'blog-detail' && id) return `/blog/${id}`;
    if (view === 'creator' && id) return `/creator/${id}`;
    if (view === 'product' && id) return `/product/${id}`;

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
    if (['affiliate-dashboard', 'affiliate-content', 'cart', 'checkout', 'orders', 'user-dashboard'].includes(view)) return role === 'customer';
    if (view.startsWith('seller-')) return role === 'seller' || role === 'admin';
    if (view.startsWith('admin-')) return role === 'admin';

    return true;
}

export function rememberCurrentRoute() {
    const pathRoute = parsePathRoute();
    const current = pathRoute ? `${pathRoute.view}${pathRoute.id ? `/${pathRoute.id}` : ''}` : window.location.hash.replace('#', '') || 'products';
    sessionStorage.setItem('post_login_redirect', current);
}
