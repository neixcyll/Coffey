import { useEffect, useMemo, useState } from 'react';

const API_BASE = '/api';

const ROAST_LEVEL_OPTIONS = [
    { value: 'light', label: 'Light' },
    { value: 'medium', label: 'Medium' },
    { value: 'medium-dark', label: 'Medium Dark' },
    { value: 'dark', label: 'Dark' },
];

const BREWING_OPTIONS = [
    { value: 'espresso', label: 'Espresso' },
    { value: 'v60', label: 'V60' },
    { value: 'aeropress', label: 'Aeropress' },
    { value: 'french-press', label: 'French Press' },
    { value: 'moka-pot', label: 'Moka Pot' },
    { value: 'tubruk', label: 'Tubruk' },
    { value: 'drip-bag', label: 'Drip Bag' },
    { value: 'cold-brew', label: 'Cold Brew' },
];

const ORDER_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded'];
const SELLER_STATUSES = ['pending', 'active', 'rejected', 'suspended'];
const PRODUCT_STATUSES = ['active', 'inactive'];
const USER_STATUSES = ['active', 'banned'];
const USER_ROLES = ['admin', 'seller', 'customer'];
const AFFILIATE_PROFILE_STATUSES = ['active', 'inactive'];
const AFFILIATE_COMMISSION_STATUSES = ['pending', 'approved', 'paid', 'cancelled'];
const ARTICLE_STATUSES = ['draft', 'pending', 'published', 'rejected'];

const CATEGORY_ROUTE_MAP = {
    review: 'review',
    'brewing-guide': 'brewing-guide',
    comparison: 'compare',
};

const PUBLIC_ROUTE_MAP = {
    blog: '/blog',
    review: '/review',
    'brewing-guide': '/brewing-guide',
    compare: '/compare',
};

function formatPrice(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function formatWeight(grams) {
    const value = Number(grams || 0);

    if (value >= 1000 && value % 1000 === 0) {
        return `${value / 1000} kg`;
    }

    if (value >= 1000) {
        return `${(value / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} kg`;
    }

    return `${value} gram`;
}

function optionLabel(options, value) {
    return options.find((option) => option.value === value)?.label || value || '-';
}

function rowsFrom(response) {
    return response?.data || [];
}

function parseHashRoute() {
    const raw = window.location.hash.replace('#', '') || 'products';
    const [path] = raw.split('?');
    const [view, id] = path.split('/');
    return { view, id };
}

function parsePathRoute() {
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

function parseRoute() {
    return parsePathRoute() || parseHashRoute();
}

function publicPathFor(view, id) {
    if (PUBLIC_ROUTE_MAP[view]) return PUBLIC_ROUTE_MAP[view];
    if (view === 'blog-detail' && id) return `/blog/${id}`;
    if (view === 'creator' && id) return `/creator/${id}`;
    if (view === 'product' && id) return `/product/${id}`;

    return null;
}

function affiliateRefFromUrl() {
    const searchRef = new URLSearchParams(window.location.search).get('ref');
    const hashQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const hashRef = new URLSearchParams(hashQuery).get('ref');

    return (searchRef || hashRef || '').trim();
}

async function apiRequest(path, { method = 'GET', body, token, isForm = false } = {}) {
    const headers = { Accept: 'application/json' };

    if (token) headers.Authorization = `Bearer ${token}`;
    if (body && !isForm) headers['Content-Type'] = 'application/json';

    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const validation = data.errors ? Object.values(data.errors).flat().join(' ') : null;
        throw new Error(validation || data.message || 'Request gagal.');
    }

    return data;
}

function upsertHeadTag(selector, createTag, attrs = {}) {
    let element = document.head.querySelector(selector);

    if (!element) {
        element = document.createElement(createTag);
        document.head.appendChild(element);
    }

    Object.entries(attrs).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
            element.removeAttribute(key);
        } else {
            element.setAttribute(key, value);
        }
    });
}

function applyArticleSeo(article) {
    if (!article) return;

    const url = `${window.location.origin}/blog/${article.slug}`;
    const title = article.meta_title || article.title;
    const description = article.meta_description || article.excerpt || 'Artikel kopi dari Marketplace Kopi.';
    const image = article.featured_image_url || article.featured_image;

    document.title = title;
    upsertHeadTag('meta[name="description"]', 'meta', { name: 'description', content: description });
    upsertHeadTag('link[rel="canonical"]', 'link', { rel: 'canonical', href: url });
    upsertHeadTag('meta[property="og:title"]', 'meta', { property: 'og:title', content: title });
    upsertHeadTag('meta[property="og:description"]', 'meta', { property: 'og:description', content: description });
    upsertHeadTag('meta[property="og:type"]', 'meta', { property: 'og:type', content: 'article' });
    upsertHeadTag('meta[property="og:url"]', 'meta', { property: 'og:url', content: url });
    upsertHeadTag('meta[property="og:image"]', 'meta', { property: 'og:image', content: image });

    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description,
        image: image ? [image] : undefined,
        datePublished: article.published_at,
        author: {
            '@type': 'Person',
            name: article.author?.creator_profile?.display_name || article.author?.name || 'Marketplace Kopi',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Marketplace Kopi',
        },
        mainEntityOfPage: url,
    };

    const products = (article.recommended_products || [])
        .filter((item) => item.title)
        .map((item) => ({
            '@type': 'Product',
            name: item.title,
            image: item.image_url,
            description: item.description,
            offers: item.internal_available && item.price ? {
                '@type': 'Offer',
                priceCurrency: 'IDR',
                price: Number(item.price),
                availability: 'https://schema.org/InStock',
                url: `${window.location.origin}/product/${item.product?.slug || item.product_id}`,
            } : undefined,
        }));

    let schema = document.getElementById('article-schema');
    if (!schema) {
        schema = document.createElement('script');
        schema.type = 'application/ld+json';
        schema.id = 'article-schema';
        document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify(products.length ? [articleSchema, ...products] : articleSchema);
}

function roleName(user) {
    return user?.role?.name;
}

function defaultLandingFor(user) {
    const role = roleName(user);

    if (role === 'seller' && user?.seller_profile?.status === 'active') return 'seller-dashboard';
    if (role === 'admin') return 'admin-dashboard';

    return 'products';
}

function canOpenAfterLogin(view, user) {
    const role = roleName(user);

    if (!view) return false;
    if (['affiliate-dashboard', 'affiliate-content', 'cart', 'checkout', 'orders', 'user-dashboard'].includes(view)) return role === 'customer';
    if (view.startsWith('seller-')) return role === 'seller' || role === 'admin';
    if (view.startsWith('admin-')) return role === 'admin';

    return true;
}

function rememberCurrentRoute() {
    const pathRoute = parsePathRoute();
    const current = pathRoute ? `${pathRoute.view}${pathRoute.id ? `/${pathRoute.id}` : ''}` : window.location.hash.replace('#', '') || 'products';
    sessionStorage.setItem('post_login_redirect', current);
}

function App() {
    const initialRoute = parseRoute();
    const [route, setRoute] = useState(initialRoute);
    const [token, setToken] = useState(() => localStorage.getItem('kopi_token'));
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('kopi_user');
        return saved ? JSON.parse(saved) : null;
    });
    const [notice, setNotice] = useState('');
    const [cartCount, setCartCount] = useState(0);
    const [sellerNotifications, setSellerNotifications] = useState({ count: 0, orders: [] });

    useEffect(() => {
        const onRouteChange = () => setRoute(parseRoute());
        window.addEventListener('popstate', onRouteChange);
        window.addEventListener('hashchange', onRouteChange);
        return () => {
            window.removeEventListener('popstate', onRouteChange);
            window.removeEventListener('hashchange', onRouteChange);
        };
    }, []);

    useEffect(() => {
        const ref = affiliateRefFromUrl();

        if (!ref) return;

        const productId = route.view === 'product' && /^\d+$/.test(route.id || '') ? route.id : '';
        const clickKey = `${ref}:${productId || 'catalog'}`;

        localStorage.setItem('affiliate_ref', ref);

        if (sessionStorage.getItem(`affiliate_click_${clickKey}`)) return;

        apiRequest('/affiliate/clicks', {
            method: 'POST',
            body: {
                code: ref,
                product_id: productId || undefined,
                landing_url: window.location.href,
            },
        })
            .then((response) => {
                localStorage.setItem('affiliate_click_id', response.data.click_id);
                sessionStorage.setItem(`affiliate_click_${clickKey}`, '1');
            })
            .catch(() => {});
    }, [route.view, route.id]);

    useEffect(() => {
        if (!token) return;

        apiRequest('/user', { token })
            .then((data) => {
                setUser(data.user);
                localStorage.setItem('kopi_user', JSON.stringify(data.user));
            })
            .catch(() => logout(false));
    }, [token]);

    useEffect(() => {
        if (!token || roleName(user) !== 'customer') {
            setCartCount(0);
            return;
        }

        refreshCartCount();
    }, [token, user?.role?.name]);

    useEffect(() => {
        if (!token || roleName(user) !== 'seller' || user?.seller_profile?.status !== 'active') {
            setSellerNotifications({ count: 0, orders: [] });
            return;
        }

        refreshSellerNotifications();
        const timer = window.setInterval(refreshSellerNotifications, 30000);

        return () => window.clearInterval(timer);
    }, [token, user?.role?.name, user?.seller_profile?.status]);

    function navigate(view, id) {
        const publicPath = publicPathFor(view, id);

        if (publicPath) {
            window.history.pushState({}, '', publicPath);
            setRoute(parseRoute());
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        window.history.pushState({}, '', `/#${id ? `${view}/${id}` : view}`);
        setRoute(parseRoute());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function saveSession(nextToken, nextUser) {
        setToken(nextToken);
        setUser(nextUser);
        localStorage.setItem('kopi_token', nextToken);
        localStorage.setItem('kopi_user', JSON.stringify(nextUser));
    }

    async function logout(callApi = true) {
        if (callApi && token) {
            await apiRequest('/logout', { method: 'POST', token }).catch(() => {});
        }
        setToken(null);
        setUser(null);
        setCartCount(0);
        setSellerNotifications({ count: 0, orders: [] });
        localStorage.removeItem('kopi_token');
        localStorage.removeItem('kopi_user');
        navigate('products');
    }

    async function refreshCartCount() {
        if (!token) return;

        const response = await apiRequest('/cart', { token }).catch(() => null);
        const items = response?.data?.items || [];
        setCartCount(items.reduce((total, item) => total + Number(item.quantity || 0), 0));
    }

    async function refreshSellerNotifications() {
        if (!token) return;

        const response = await apiRequest('/seller/notifications', { token }).catch(() => null);
        setSellerNotifications(response?.data || { count: 0, orders: [] });
    }

    const context = {
        token,
        user,
        navigate,
        setNotice,
        saveSession,
        logout,
        refreshCartCount,
        refreshSellerNotifications,
    };

    return (
        <div className="app-shell">
            <Header
                user={user}
                navigate={navigate}
                logout={logout}
                currentView={route.view}
                cartCount={cartCount}
                sellerNotifications={sellerNotifications}
            />
            {notice && <div className="notice">{notice}</div>}
            <main className="page">
                {route.view === 'login' && <AuthPage mode="login" {...context} />}
                {route.view === 'register' && <AuthPage mode="register" {...context} />}
                {route.view === 'blog' && <BlogIndexPage {...context} />}
                {route.view === 'review' && <BlogIndexPage categorySlug="review" {...context} />}
                {route.view === 'brewing-guide' && <BlogIndexPage categorySlug="brewing-guide" {...context} />}
                {route.view === 'compare' && <BlogIndexPage categorySlug="comparison" {...context} />}
                {route.view === 'blog-detail' && <BlogArticlePage slug={route.id} {...context} />}
                {route.view === 'creator' && <CreatorPage username={route.id} {...context} />}
                {route.view === 'product' && <ProductDetail productId={route.id} {...context} />}
                {route.view === 'cart' && <CartPage {...context} />}
                {route.view === 'checkout' && <CheckoutPage {...context} />}
                {route.view === 'orders' && <OrderHistory {...context} />}
                {route.view === 'user-dashboard' && <UserDashboardPage {...context} />}
                {route.view === 'affiliate-dashboard' && <AffiliateDashboardPage {...context} />}
                {route.view === 'affiliate-content' && <AffiliateContentPage {...context} />}
                {route.view === 'seller-dashboard' && <SellerDashboard {...context} />}
                {route.view === 'seller-products' && <SellerProducts {...context} />}
                {route.view === 'seller-orders' && <SellerOrders {...context} />}
                {route.view === 'admin-dashboard' && <AdminDashboardPage {...context} />}
                {route.view === 'admin-users' && <AdminUsersPage {...context} />}
                {route.view === 'admin-sellers' && <AdminSellersPage {...context} />}
                {route.view === 'admin-categories' && <AdminCategoriesPage {...context} />}
                {route.view === 'admin-products' && <AdminProductsPage {...context} />}
                {route.view === 'admin-orders' && <AdminOrdersPage {...context} />}
                {route.view === 'admin-payments' && <AdminPaymentsPage {...context} />}
                {route.view === 'admin-reports' && <AdminReportsPage {...context} />}
                {route.view === 'admin-affiliates' && <AdminAffiliatesPage {...context} />}
                {route.view === 'admin-affiliate-commissions' && <AdminAffiliateCommissionsPage {...context} />}
                {route.view === 'admin-content' && <AdminContentPage {...context} />}
                {![ 
                    'login',
                    'register',
                    'blog',
                    'review',
                    'brewing-guide',
                    'compare',
                    'blog-detail',
                    'creator',
                    'product',
                    'cart',
                    'checkout',
                    'orders',
                    'user-dashboard',
                    'affiliate-dashboard',
                    'affiliate-content',
                    'seller-dashboard',
                    'seller-products',
                    'seller-orders',
                    'admin-dashboard',
                    'admin-users',
                    'admin-sellers',
                    'admin-categories',
                    'admin-products',
                    'admin-orders',
                    'admin-payments',
                    'admin-reports',
                    'admin-affiliates',
                    'admin-affiliate-commissions',
                    'admin-content',
                ].includes(route.view) && <CatalogPage {...context} />}
            </main>
        </div>
    );
}

function Header({ user, navigate, logout, currentView, cartCount, sellerNotifications }) {
    const role = roleName(user);
    const [showNotifications, setShowNotifications] = useState(false);
    const itemClass = (view) => (currentView === view ? 'nav-item active' : 'nav-item');
    const notificationOrders = sellerNotifications?.orders || [];

    return (
        <header className="topbar">
            <button className="brand" onClick={() => navigate('products')}>
                <span className="brand-mark">K</span>
                <span>
                    <strong>Marketplace Kopi</strong>
                    <small>Core ecommerce</small>
                </span>
            </button>

            <nav className="nav">
                <button className={itemClass('products')} onClick={() => navigate('products')}>Produk</button>
                <button className={itemClass('blog')} onClick={() => navigate('blog')}>Blog</button>
                <button className={itemClass('review')} onClick={() => navigate('review')}>Review</button>
                <button className={itemClass('brewing-guide')} onClick={() => navigate('brewing-guide')}>Guide</button>
                {role === 'customer' && (
                    <>
                        <button className={itemClass('user-dashboard')} onClick={() => navigate('user-dashboard')}>Dashboard</button>
                        <button className={itemClass('orders')} onClick={() => navigate('orders')}>Order</button>
                    </>
                )}
                {(!role || role === 'customer') && (
                    <>
                        <button className={itemClass('affiliate-dashboard')} onClick={() => navigate('affiliate-dashboard')}>Affiliate</button>
                        {role === 'customer' && <button className={itemClass('affiliate-content')} onClick={() => navigate('affiliate-content')}>Content</button>}
                    </>
                )}
                {role === 'seller' && (
                    <>
                        <button className={itemClass('seller-dashboard')} onClick={() => navigate('seller-dashboard')}>Seller</button>
                        <button className={itemClass('seller-products')} onClick={() => navigate('seller-products')}>Produk Saya</button>
                        <button className={itemClass('seller-orders')} onClick={() => navigate('seller-orders')}>Order Masuk</button>
                    </>
                )}
                {role === 'admin' && (
                    <button className={itemClass('admin-dashboard')} onClick={() => navigate('admin-dashboard')}>Admin</button>
                )}
            </nav>

            <div className="account">
                {user ? (
                    <>
                        {role === 'seller' && (
                            <div className="notification-wrap">
                                <button
                                    className={`${itemClass('seller-orders')} notification-button`}
                                    title="Notifikasi order masuk"
                                    aria-label="Notifikasi order masuk"
                                    onClick={() => setShowNotifications((current) => !current)}
                                >
                                    <BellIcon />
                                    {Number(sellerNotifications?.count || 0) > 0 && <span className="cart-badge">{sellerNotifications.count}</span>}
                                </button>
                                {showNotifications && (
                                    <div className="notification-popover">
                                        <div className="row between">
                                            <strong>Order masuk</strong>
                                            <button className="btn ghost compact-btn" onClick={() => { setShowNotifications(false); navigate('seller-orders'); }}>Lihat semua</button>
                                        </div>
                                        <div className="notification-list">
                                            {notificationOrders.map((order) => (
                                                <button
                                                    key={order.id}
                                                    className="notification-item"
                                                    onClick={() => { setShowNotifications(false); navigate('seller-orders'); }}
                                                >
                                                    <span>
                                                        <strong>{order.order_number}</strong>
                                                        <small>{order.customer_name} - {formatPrice(order.seller_total)}</small>
                                                    </span>
                                                    <small>{new Date(order.created_at).toLocaleString('id-ID')}</small>
                                                </button>
                                            ))}
                                            {notificationOrders.length === 0 && <p className="muted">Belum ada order baru yang perlu diproses.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {role === 'customer' && (
                            <button className={`${itemClass('cart')} cart-header-button`} title="Cart" aria-label="Cart" onClick={() => navigate('cart')}>
                                <CartIcon />
                                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                            </button>
                        )}
                        <span>{user.name}</span>
                        <button className="btn ghost" onClick={() => logout()}>Logout</button>
                    </>
                ) : (
                    <>
                        <button className="btn ghost" onClick={() => navigate('login')}>Login</button>
                        <button className="btn primary" onClick={() => navigate('register')}>Register</button>
                    </>
                )}
            </div>
        </header>
    );
}

function CartIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 6H6" />
        </svg>
    );
}

function BellIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    );
}

function AuthPage({ mode, saveSession, navigate, setNotice }) {
    const [isSeller, setIsSeller] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        store_name: '',
        phone: '',
        address: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const isLogin = mode === 'login';

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    async function submit(event) {
        event.preventDefault();
        setLoading(true);
        setNotice('');

        try {
            const path = isLogin ? '/login' : isSeller ? '/register/seller' : '/register';
            const payload = isLogin
                ? { email: form.email, password: form.password }
                : form;
            const data = await apiRequest(path, { method: 'POST', body: payload });
            saveSession(data.token, data.user);
            setNotice(data.message);
            const redirect = sessionStorage.getItem('post_login_redirect');
            sessionStorage.removeItem('post_login_redirect');
            navigate(canOpenAfterLogin(redirect, data.user) ? redirect : defaultLandingFor(data.user));
        } catch (error) {
            setNotice(error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="auth-layout">
            <div>
                <p className="eyebrow">Akses akun</p>
                <h1>{isLogin ? 'Login' : 'Register'}</h1>
                <p className="muted">Gunakan akun seeder: admin@kopi.test, seller@kopi.test, atau customer@kopi.test dengan password <code>password</code>.</p>
            </div>
            <form className="panel form-grid" onSubmit={submit}>
                {!isLogin && (
                    <div className="segmented">
                        <button type="button" className={!isSeller ? 'selected' : ''} onClick={() => setIsSeller(false)}>Customer</button>
                        <button type="button" className={isSeller ? 'selected' : ''} onClick={() => setIsSeller(true)}>Seller</button>
                    </div>
                )}
                {!isLogin && <TextInput label="Nama" value={form.name} onChange={(value) => update('name', value)} />}
                <TextInput label="Email" type="email" value={form.email} onChange={(value) => update('email', value)} />
                <TextInput label="Password" type="password" value={form.password} onChange={(value) => update('password', value)} />
                {!isLogin && <TextInput label="Konfirmasi Password" type="password" value={form.password_confirmation} onChange={(value) => update('password_confirmation', value)} />}
                {!isLogin && isSeller && (
                    <>
                        <TextInput label="Nama Toko" value={form.store_name} onChange={(value) => update('store_name', value)} />
                        <TextInput label="Telepon" value={form.phone} onChange={(value) => update('phone', value)} required={false} />
                        <TextArea label="Alamat Toko" value={form.address} onChange={(value) => update('address', value)} />
                        <TextArea label="Deskripsi Toko" value={form.description} onChange={(value) => update('description', value)} />
                    </>
                )}
                <button className="btn primary wide" disabled={loading}>{loading ? 'Memproses...' : isLogin ? 'Login' : 'Register'}</button>
            </form>
        </section>
    );
}

function CatalogPage({ token, user, navigate, setNotice, refreshCartCount }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', category: '', roast_level: '', origin: '' });

    useEffect(() => {
        apiRequest('/categories').then((data) => setCategories(data.data));
    }, []);

    useEffect(() => {
        const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
        setLoading(true);
        apiRequest(`/products?${query}`)
            .then((data) => setProducts(data.data || []))
            .catch((error) => setNotice(error.message))
            .finally(() => setLoading(false));
    }, [filters, setNotice]);

    async function addToCart(productId) {
        if (!token || roleName(user) !== 'customer') {
            setNotice('Login sebagai customer untuk belanja.');
            navigate('login');
            return;
        }

        try {
            await apiRequest('/cart/items', { method: 'POST', token, body: { product_id: productId, quantity: 1 } });
            await refreshCartCount?.();
            setNotice('Produk berhasil ditambahkan ke cart. Cek ikon cart di kanan atas.');
        } catch (error) {
            setNotice(error.message);
        }
    }

    return (
        <section>
            <div className="section-head">
                <div>
                    <p className="eyebrow">Katalog kopi</p>
                    <h1>Produk kopi dari seller</h1>
                </div>
            </div>
            <div className="filters">
                <input placeholder="Cari kopi, origin, atau deskripsi" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} />
                <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
                    <option value="">Semua kategori</option>
                    {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                </select>
                <select value={filters.roast_level} onChange={(event) => setFilters({ ...filters, roast_level: event.target.value })}>
                    <option value="">Roast level</option>
                    {ROAST_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <input placeholder="Origin" value={filters.origin} onChange={(event) => setFilters({ ...filters, origin: event.target.value })} />
            </div>
            {loading ? (
                <p className="muted">Memuat produk...</p>
            ) : (
                <div className="product-grid">
                    {products.map((product) => (
                        <article className="product-card" key={product.id}>
                            <ProductImage product={product} />
                            <div className="product-body">
                                <div>
                                    <span className="tag">{product.category?.name}</span>
                                    <h3>{product.name}</h3>
                                    <p className="muted">{product.origin} - {optionLabel(ROAST_LEVEL_OPTIONS, product.roast_level)}</p>
                                </div>
                                <strong>{formatPrice(product.price)}</strong>
                                <div className="row">
                                    <button className="btn ghost" onClick={() => navigate('product', product.slug || product.id)}>Detail</button>
                                    <button className="btn primary" onClick={() => addToCart(product.id)}>Cart</button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}

function ProductDetail({ productId, token, user, navigate, setNotice, refreshCartCount }) {
    const [product, setProduct] = useState(null);

    useEffect(() => {
        apiRequest(`/products/${productId}`)
            .then((data) => setProduct(data.data))
            .catch((error) => setNotice(error.message));
    }, [productId, setNotice]);

    async function addToCart() {
        if (!token || roleName(user) !== 'customer') {
            setNotice('Login sebagai customer untuk belanja.');
            navigate('login');
            return;
        }

        try {
            await apiRequest('/cart/items', { method: 'POST', token, body: { product_id: product.id, quantity: 1 } });
            await refreshCartCount?.();
            setNotice('Produk berhasil ditambahkan ke cart. Cek ikon cart di kanan atas.');
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function copyAffiliateLink() {
        if (!token || roleName(user) !== 'customer') {
            setNotice('Login sebagai customer untuk membuat link affiliate.');
            navigate('login');
            return;
        }

        try {
            const response = await apiRequest('/affiliate/dashboard', { token });
            if (response.data.requires_registration) {
                setNotice('Daftar affiliate terlebih dahulu.');
                navigate('affiliate-dashboard');
                return;
            }
            const code = response.data.profile.code;
            await navigator.clipboard?.writeText(`${window.location.origin}/product/${product.slug || product.id}?ref=${code}`);
            setNotice('Link affiliate produk disalin.');
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!product) return <p className="muted">Memuat detail...</p>;

    return (
        <section className="detail-layout">
            <ProductImage product={product} large />
            <div className="panel detail-copy">
                <span className="tag">{product.category?.name}</span>
                <h1>{product.name}</h1>
                <p>{product.description}</p>
                <dl className="specs">
                    <div><dt>Harga</dt><dd>{formatPrice(product.price)}</dd></div>
                    <div><dt>Stock</dt><dd>{product.stock}</dd></div>
                    <div><dt>Berat</dt><dd>{formatWeight(product.weight)}</dd></div>
                    <div><dt>Origin</dt><dd>{product.origin}</dd></div>
                    <div><dt>Roast</dt><dd>{optionLabel(ROAST_LEVEL_OPTIONS, product.roast_level)}</dd></div>
                    <div><dt>Brewing</dt><dd>{optionLabel(BREWING_OPTIONS, product.brewing_method)}</dd></div>
                    <div><dt>Seller</dt><dd>{product.seller?.store_name}</dd></div>
                </dl>
                <div className="row">
                    <button className="btn primary" onClick={addToCart}>Tambah ke Cart</button>
                    {roleName(user) === 'customer' && <button className="btn ghost" onClick={copyAffiliateLink}>Copy affiliate link</button>}
                </div>
            </div>
        </section>
    );
}

function BlogIndexPage({ categorySlug = '', navigate, setNotice }) {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(categorySlug);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setSelectedCategory(categorySlug);
    }, [categorySlug]);

    useEffect(() => {
        apiRequest('/article-categories')
            .then((response) => setCategories(response.data || []))
            .catch((error) => setNotice(error.message));
    }, [setNotice]);

    useEffect(() => {
        const query = new URLSearchParams();
        if (selectedCategory) query.set('category', selectedCategory);
        if (search) query.set('search', search);
        setLoading(true);
        apiRequest(`/articles?${query}`)
            .then((response) => setArticles(rowsFrom(response)))
            .catch((error) => setNotice(error.message))
            .finally(() => setLoading(false));
    }, [selectedCategory, search, setNotice]);

    function openCategory(category) {
        const route = CATEGORY_ROUTE_MAP[category.slug];
        if (route) {
            navigate(route);
            return;
        }

        setSelectedCategory(category.slug);
    }

    const activeCategory = categories.find((category) => category.slug === selectedCategory);
    const title = activeCategory ? activeCategory.name : 'Coffee Journal';
    const featured = articles[0];
    const rest = featured ? articles.slice(1) : articles;

    return (
        <section className="content-page">
            <div className="content-hero">
                <div>
                    <p className="eyebrow">Content layer</p>
                    <h1>{title}</h1>
                    <p className="muted">Review, brewing guide, comparison, dan rekomendasi produk yang terhubung langsung ke marketplace.</p>
                </div>
                <div className="content-search">
                    <input placeholder="Cari artikel kopi" value={search} onChange={(event) => setSearch(event.target.value)} />
                </div>
            </div>

            <div className="category-tabs">
                <button className={!selectedCategory ? 'active' : ''} onClick={() => { setSelectedCategory(''); navigate('blog'); }}>Semua</button>
                {categories.map((category) => (
                    <button key={category.id} className={selectedCategory === category.slug ? 'active' : ''} onClick={() => openCategory(category)}>
                        {category.name}
                    </button>
                ))}
            </div>

            {loading ? <p className="muted">Memuat artikel...</p> : (
                <>
                    {featured && (
                        <article className="featured-article">
                            <ArticleImage article={featured} />
                            <div className="featured-copy">
                                <span className="tag">{featured.category?.name}</span>
                                <h2>{featured.title}</h2>
                                <p className="muted">{featured.excerpt}</p>
                                <div className="row">
                                    <button className="btn primary" onClick={() => navigate('blog-detail', featured.slug)}>Baca artikel</button>
                                    {featured.author?.creator_profile?.username && (
                                        <button className="btn ghost" onClick={() => navigate('creator', featured.author.creator_profile.username)}>
                                            {featured.author.creator_profile.display_name}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </article>
                    )}

                    <div className="article-grid">
                        {rest.map((article) => <ArticleCard key={article.id} article={article} navigate={navigate} />)}
                    </div>
                    {articles.length === 0 && <p className="muted">Belum ada artikel published untuk kategori ini.</p>}
                </>
            )}
        </section>
    );
}

function BlogArticlePage({ slug, token, navigate, setNotice }) {
    const [article, setArticle] = useState(null);

    useEffect(() => {
        if (!slug) return;
        apiRequest(`/articles/${slug}`)
            .then((response) => {
                setArticle(response.data);
                applyArticleSeo(response.data);
            })
            .catch((error) => setNotice(error.message));
    }, [slug, setNotice]);

    async function trackProductClick(item) {
        if (!article) return;

        try {
            const response = await apiRequest(`/articles/${article.slug}/clicks`, {
                method: 'POST',
                token,
                body: {
                    article_product_id: item.id,
                    product_id: item.product_id || undefined,
                    target_url: item.external_url || undefined,
                    referrer: document.referrer || window.location.href,
                    landing_url: window.location.href,
                },
            });
            const payload = response.data;

            if (payload.affiliate_code) localStorage.setItem('affiliate_ref', payload.affiliate_code);
            if (payload.affiliate_click_id) localStorage.setItem('affiliate_click_id', payload.affiliate_click_id);

            if (payload.internal && item.product) {
                navigate('product', item.product.slug || item.product.id);
                return;
            }

            if (payload.target_url) {
                window.location.href = payload.target_url;
                return;
            }

            setNotice('Link produk belum tersedia.');
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!article) return <p className="muted">Memuat artikel...</p>;

    const authorProfile = article.author?.creator_profile;
    const paragraphs = (article.content || '').split(/\n{2,}/).filter(Boolean);

    return (
        <article className="article-layout">
            <header className="article-header">
                <span className="tag">{article.category?.name}</span>
                <h1>{article.title}</h1>
                <p className="article-excerpt">{article.excerpt}</p>
                <div className="article-meta">
                    <span>{authorProfile?.display_name || article.author?.name}</span>
                    <span>{article.published_at ? new Date(article.published_at).toLocaleDateString('id-ID') : '-'}</span>
                    <span>{article.views_count || 0} views</span>
                </div>
            </header>

            {article.featured_image_url && <img className="article-cover" src={article.featured_image_url} alt={article.title} />}

            <div className="article-body">
                {paragraphs.map((paragraph, index) => <p key={`${article.id}-p-${index}`}>{paragraph}</p>)}
            </div>

            {(article.recommended_products || []).length > 0 && (
                <section className="recommended-section">
                    <div className="section-head">
                        <div>
                            <p className="eyebrow">Recommended Products</p>
                            <h2>Produk yang disebut di artikel</h2>
                        </div>
                    </div>
                    <div className="recommended-grid">
                        {article.recommended_products.map((item) => (
                            <div className="recommended-card" key={item.id}>
                                {item.image_url ? <img src={item.image_url} alt={item.title} /> : <div className="product-image small placeholder">{item.title?.slice(0, 1) || 'K'}</div>}
                                <div>
                                    <span className="tag">{item.internal_available ? 'Marketplace' : item.external_platform || 'External'}</span>
                                    <h3>{item.title}</h3>
                                    <p className="muted">{item.description}</p>
                                    <strong>{item.internal_available ? formatPrice(item.price) : item.price_label || 'Cek harga terbaru'}</strong>
                                </div>
                                <button className={item.internal_available ? 'btn primary wide' : 'btn ghost wide'} onClick={() => trackProductClick(item)}>
                                    {item.cta_label}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section className="author-box">
                <div className="author-avatar">{(authorProfile?.display_name || article.author?.name || 'K').slice(0, 1)}</div>
                <div>
                    <p className="eyebrow">Author</p>
                    <h2>{authorProfile?.display_name || article.author?.name}</h2>
                    <p className="muted">{authorProfile?.bio || 'Creator dan reviewer kopi di Marketplace Kopi.'}</p>
                    {authorProfile?.username && <button className="btn ghost" onClick={() => navigate('creator', authorProfile.username)}>Lihat profil creator</button>}
                </div>
            </section>

            {(article.related_articles || []).length > 0 && (
                <section>
                    <div className="section-head">
                        <div>
                            <p className="eyebrow">Artikel terkait</p>
                            <h2>Baca selanjutnya</h2>
                        </div>
                    </div>
                    <div className="article-grid">
                        {article.related_articles.map((related) => <ArticleCard key={related.id} article={related} navigate={navigate} />)}
                    </div>
                </section>
            )}
        </article>
    );
}

function CreatorPage({ username, navigate, setNotice }) {
    const [profile, setProfile] = useState(null);
    const [articles, setArticles] = useState([]);

    useEffect(() => {
        if (!username) return;
        apiRequest(`/creators/${username}`)
            .then((response) => {
                setProfile(response.data.profile);
                setArticles(response.data.articles?.data || []);
            })
            .catch((error) => setNotice(error.message));
    }, [username, setNotice]);

    if (!profile) return <p className="muted">Memuat creator...</p>;

    return (
        <section className="content-page">
            <div className="creator-header">
                <div className="author-avatar large">{profile.display_name?.slice(0, 1) || 'K'}</div>
                <div>
                    <p className="eyebrow">Creator</p>
                    <h1>{profile.display_name}</h1>
                    <p className="muted">{profile.bio || 'Creator kopi di Marketplace Kopi.'}</p>
                    {profile.affiliate_code && <code>{profile.affiliate_code}</code>}
                </div>
            </div>
            <div className="article-grid">
                {articles.map((article) => <ArticleCard key={article.id} article={article} navigate={navigate} />)}
            </div>
            {articles.length === 0 && <p className="muted">Creator ini belum memiliki artikel published.</p>}
        </section>
    );
}

function ArticleCard({ article, navigate }) {
    return (
        <article className="article-card">
            <ArticleImage article={article} />
            <div className="article-card-body">
                <span className="tag">{article.category?.name}</span>
                <h3>{article.title}</h3>
                <p className="muted">{article.excerpt}</p>
                <div className="row between">
                    <small className="muted">{article.published_at ? new Date(article.published_at).toLocaleDateString('id-ID') : '-'}</small>
                    <button className="btn ghost compact-btn" onClick={() => navigate('blog-detail', article.slug)}>Baca</button>
                </div>
            </div>
        </article>
    );
}

function ArticleImage({ article }) {
    const src = article.featured_image_url || article.featured_image;

    if (src) return <img className="article-image" src={src} alt={article.title} />;

    return <div className="article-image placeholder">{article.title?.slice(0, 1) || 'K'}</div>;
}

function CartPage({ token, navigate, setNotice, refreshCartCount }) {
    const [cart, setCart] = useState(null);

    useEffect(() => {
        if (!token) return;
        loadCart();
    }, [token]);

    async function loadCart() {
        try {
            const data = await apiRequest('/cart', { token });
            setCart(data.data);
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function updateItem(item, quantity) {
        try {
            await apiRequest(`/cart/items/${item.id}`, { method: 'PUT', token, body: { quantity: Number(quantity) } });
            loadCart();
            refreshCartCount?.();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function removeItem(item) {
        await apiRequest(`/cart/items/${item.id}`, { method: 'DELETE', token }).catch((error) => setNotice(error.message));
        loadCart();
        refreshCartCount?.();
    }

    if (!token) return <NeedLogin navigate={navigate} />;
    if (!cart) return <p className="muted">Memuat cart...</p>;

    return (
        <section>
            <div className="section-head">
                <div>
                    <p className="eyebrow">Cart</p>
                    <h1>Item belanja</h1>
                </div>
                <strong>{formatPrice(cart.total_amount)}</strong>
            </div>
            <div className="stack">
                {cart.items.map((item) => (
                    <div className="line-item" key={item.id}>
                        <ProductImage product={item.product} small />
                        <div>
                            <strong>{item.product.name}</strong>
                            <p className="muted">{formatPrice(item.product.price)} - stock {item.product.stock}</p>
                        </div>
                        <input className="qty" type="number" min="1" value={item.quantity} onChange={(event) => updateItem(item, event.target.value)} />
                        <strong>{formatPrice(item.subtotal)}</strong>
                        <button className="btn ghost" onClick={() => removeItem(item)}>Hapus</button>
                    </div>
                ))}
                {cart.items.length === 0 && <p className="muted">Cart kosong.</p>}
            </div>
            <button className="btn primary checkout-btn" disabled={cart.items.length === 0} onClick={() => navigate('checkout')}>Checkout</button>
        </section>
    );
}

function CheckoutPage({ token, user, navigate, setNotice, refreshCartCount }) {
    const [form, setForm] = useState({ customer_name: user?.name || '', customer_phone: '', shipping_address: '', notes: '' });
    const [loading, setLoading] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setLoading(true);
        setNotice('');

        try {
            const affiliateCode = localStorage.getItem('affiliate_ref');
            const affiliateClickId = localStorage.getItem('affiliate_click_id');
            const data = await apiRequest('/checkout', {
                method: 'POST',
                token,
                body: {
                    ...form,
                    affiliate_code: affiliateCode || undefined,
                    affiliate_click_id: affiliateClickId || undefined,
                },
            });
            setNotice('Order dibuat. Membuka Midtrans Snap.');
            await refreshCartCount?.();
            await openSnap(data, token, setNotice, () => navigate('orders'));
        } catch (error) {
            setNotice(error.message);
        } finally {
            setLoading(false);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section className="auth-layout">
            <div>
                <p className="eyebrow">Checkout</p>
                <h1>Alamat pengiriman</h1>
                <p className="muted">Stock baru dikurangi setelah Midtrans mengirim status sukses ke webhook backend.</p>
            </div>
            <form className="panel form-grid" onSubmit={submit}>
                <TextInput label="Nama penerima" value={form.customer_name} onChange={(value) => setForm({ ...form, customer_name: value })} />
                <TextInput label="Telepon" value={form.customer_phone} onChange={(value) => setForm({ ...form, customer_phone: value })} />
                <TextArea label="Alamat" value={form.shipping_address} onChange={(value) => setForm({ ...form, shipping_address: value })} />
                <TextArea label="Catatan" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
                <button className="btn primary wide" disabled={loading}>{loading ? 'Membuat order...' : 'Bayar dengan Snap'}</button>
            </form>
        </section>
    );
}

async function openSnap(data, token, setNotice, onDone) {
    const scriptUrl = data.snap_script_url;
    const clientKey = data.midtrans_client_key;

    if (!window.snap) {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = scriptUrl;
            script.dataset.clientKey = clientKey || '';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    if (!window.snap) {
        setNotice('snap.js gagal dimuat.');
        return;
    }

    window.snap.pay(data.snap_token, {
        onSuccess: async (result) => {
            const synced = await syncPaymentAfterSnap(data, token, setNotice, result);
            if (synced) setNotice('Pembayaran sukses. Status order sudah disinkronkan.');
            onDone();
        },
        onPending: () => {
            setNotice('Pembayaran pending. Selesaikan pembayaran sesuai instruksi Midtrans.');
            onDone();
        },
        onError: () => setNotice('Pembayaran gagal.'),
        onClose: () => setNotice('Popup Snap ditutup sebelum pembayaran selesai.'),
    });
}

async function syncPaymentAfterSnap(data, token, setNotice, snapResult = null) {
    const orderId = data?.data?.id;

    if (!orderId || !token) return false;

    for (let attempt = 0; attempt < 4; attempt += 1) {
        try {
            const response = await apiRequest(`/orders/${orderId}/sync-payment`, {
                method: 'POST',
                token,
                body: snapResult ? { snap_result: snapResult } : undefined,
            });
            const order = response.data;
            const paidStatuses = ['paid', 'processing', 'shipped', 'completed'];

            if (paidStatuses.includes(order?.status) || order?.payment?.status === 'paid') {
                return true;
            }
        } catch (error) {
            setNotice(error.message);
            return false;
        }

        await new Promise((resolve) => window.setTimeout(resolve, 1200 * (attempt + 1)));
    }

    setNotice('Pembayaran diterima Snap, tetapi status order masih menunggu sinkronisasi Midtrans.');
    return false;
}

function OrderHistory({ token, navigate, setNotice }) {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!token) return;
        apiRequest('/orders', { token })
            .then((data) => setOrders(data.data || []))
            .catch((error) => setNotice(error.message));
    }, [token, setNotice]);

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section>
            <div className="section-head">
                <div>
                    <p className="eyebrow">Order</p>
                    <h1>Riwayat order</h1>
                </div>
            </div>
            <div className="stack">
                {orders.map((order) => <OrderCard key={order.id} order={order} />)}
                {orders.length === 0 && <p className="muted">Belum ada order.</p>}
            </div>
        </section>
    );
}

function UserDashboardPage({ token, user, navigate, setNotice, saveSession }) {
    const [orders, setOrders] = useState([]);
    const [form, setForm] = useState({
        name: user?.name || '',
        email: user?.email || '',
        password: '',
        password_confirmation: '',
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setForm((current) => ({
                ...current,
                name: user.name || '',
                email: user.email || '',
            }));
        }
    }, [user?.id, user?.name, user?.email]);

    useEffect(() => {
        if (!token) return;
        apiRequest('/orders', { token })
            .then((data) => setOrders(data.data || []))
            .catch((error) => setNotice(error.message));
    }, [token, setNotice]);

    async function saveProfile(event) {
        event.preventDefault();
        setSaving(true);
        setNotice('');

        try {
            const payload = {
                name: form.name,
                email: form.email,
            };

            if (form.password) {
                payload.password = form.password;
                payload.password_confirmation = form.password_confirmation;
            }

            const response = await apiRequest('/user', { method: 'PATCH', token, body: payload });
            saveSession(token, response.user);
            setForm((current) => ({ ...current, password: '', password_confirmation: '' }));
            setNotice(response.message);
        } catch (error) {
            setNotice(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    const paidOrders = orders.filter((order) => ['paid', 'processing', 'shipped', 'completed'].includes(order.status));
    const totalSpent = paidOrders.reduce((total, order) => total + Number(order.total_amount || 0), 0);

    return (
        <section className="customer-dashboard">
            <PageTitle eyebrow="Customer" title="Dashboard akun" />
            <div className="stats">
                <Stat label="Total order" value={orders.length} />
                <Stat label="Order aktif" value={orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length} />
                <Stat label="Total belanja" value={formatPrice(totalSpent)} />
            </div>
            <div className="dashboard-grid">
                <div className="panel form-grid">
                    <h2>Pengaturan akun</h2>
                    <form className="form-grid" onSubmit={saveProfile}>
                        <TextInput label="Nama" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                        <TextInput label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
                        <div className="grid-2">
                            <TextInput label="Password baru" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} required={false} />
                            <TextInput label="Konfirmasi password" type="password" value={form.password_confirmation} onChange={(value) => setForm({ ...form, password_confirmation: value })} required={false} />
                        </div>
                        <button className="btn primary" disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan akun'}</button>
                    </form>
                </div>
                <div className="stack">
                    <div className="section-head">
                        <div>
                            <p className="eyebrow">Riwayat</p>
                            <h2>Order terbaru</h2>
                        </div>
                        <button className="btn ghost" onClick={() => navigate('orders')}>Lihat semua</button>
                    </div>
                    {orders.slice(0, 5).map((order) => <OrderCard key={order.id} order={order} />)}
                    {orders.length === 0 && <p className="muted">Belum ada order.</p>}
                </div>
            </div>
        </section>
    );
}

function AffiliateDashboardPage({ token, user, navigate, setNotice, logout }) {
    const [data, setData] = useState(null);
    const [commissions, setCommissions] = useState([]);
    const [registering, setRegistering] = useState(false);
    const [form, setForm] = useState({
        affiliate_name: user?.name || '',
        phone: '',
        payout_bank: '',
        payout_account_name: user?.name || '',
        payout_account_number: '',
        notes: '',
    });

    useEffect(() => {
        if (!token) return;
        loadAffiliate();
    }, [token]);

    async function loadAffiliate() {
        try {
            const dashboard = await apiRequest('/affiliate/dashboard', { token });
            setData(dashboard.data);

            if (!dashboard.data.requires_registration) {
                const commissionResponse = await apiRequest('/affiliate/commissions', { token });
                setCommissions(rowsFrom(commissionResponse));
            } else {
                setCommissions([]);
            }
        } catch (error) {
            setNotice(error.message);
            setData(false);
        }
    }

    async function registerAffiliate(event) {
        event.preventDefault();
        setRegistering(true);
        setNotice('');

        try {
            await apiRequest('/affiliate/register', { method: 'POST', token, body: form });
            setNotice('Pendaftaran affiliate berhasil.');
            await loadAffiliate();
        } catch (error) {
            setNotice(error.message);
        } finally {
            setRegistering(false);
        }
    }

    async function copyLink(path = '#products') {
        const code = data?.profile?.code;
        if (!code) return;

        const link = `${window.location.origin}${window.location.pathname}?ref=${code}${path}`;
        await navigator.clipboard?.writeText(link);
        setNotice('Link affiliate disalin.');
    }

    if (!token) return <NeedLogin navigate={navigate} />;
    if (!user) return <p className="muted">Memuat akun...</p>;
    if (roleName(user) !== 'customer') return <NeedCustomerAccount logout={logout} />;
    if (data === false) return <NeedCustomerAccount logout={logout} />;
    if (!data) return <p className="muted">Memuat affiliate...</p>;

    if (data.requires_registration) {
        return (
            <section className="auth-layout">
                <div>
                    <p className="eyebrow">Affiliate</p>
                    <h1>Daftar akun affiliate</h1>
                    <p className="muted">Akun customer kamu tetap dipakai untuk login. Form ini membuat akun affiliate yang terhubung ke user tersebut.</p>
                </div>
                <form className="panel form-grid" onSubmit={registerAffiliate}>
                    <TextInput label="Nama affiliate" value={form.affiliate_name} onChange={(value) => setForm({ ...form, affiliate_name: value })} />
                    <TextInput label="Telepon" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} required={false} />
                    <div className="grid-2">
                        <TextInput label="Bank payout" value={form.payout_bank} onChange={(value) => setForm({ ...form, payout_bank: value })} required={false} />
                        <TextInput label="Nomor rekening" value={form.payout_account_number} onChange={(value) => setForm({ ...form, payout_account_number: value })} required={false} />
                    </div>
                    <TextInput label="Nama pemilik rekening" value={form.payout_account_name} onChange={(value) => setForm({ ...form, payout_account_name: value })} required={false} />
                    <TextArea label="Catatan" value={form.notes} onChange={(value) => setForm({ ...form, notes: value })} />
                    <button className="btn primary wide" disabled={registering}>{registering ? 'Mendaftarkan...' : 'Daftar menjadi affiliate'}</button>
                </form>
            </section>
        );
    }

    const summary = data.summary;

    return (
        <section>
            <PageTitle eyebrow="Affiliate" title="Dashboard affiliate" />
            <div className="panel affiliate-card">
                <div>
                    <span className="muted">Kode affiliate</span>
                    <strong>{data.profile.code}</strong>
                </div>
                <div className="row">
                    <button className="btn primary" onClick={() => copyLink('#products')}>Copy katalog link</button>
                    <button className="btn ghost" onClick={() => navigate('affiliate-content')}>Content</button>
                </div>
            </div>
            <div className="stats">
                <Stat label="Klik" value={summary.total_clicks} />
                <Stat label="Konversi" value={summary.total_conversions} />
                <Stat label="Pending" value={formatPrice(summary.pending_commission)} />
                <Stat label="Approved" value={formatPrice(summary.approved_commission)} />
                <Stat label="Paid" value={formatPrice(summary.paid_commission)} />
                <Stat label="Total" value={formatPrice(summary.total_commission)} />
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Order</th><th>Produk</th><th>Subtotal</th><th>Komisi</th><th>Status</th></tr></thead>
                    <tbody>
                        {commissions.map((commission) => (
                            <tr key={commission.id}>
                                <td>{commission.order?.order_number}</td>
                                <td>{commission.product?.name || '-'}</td>
                                <td>{formatPrice(commission.amount)}</td>
                                <td>{formatPrice(commission.commission_amount)}</td>
                                <td>{commission.status}</td>
                            </tr>
                        ))}
                        {commissions.length === 0 && <tr><td colSpan="5">Belum ada komisi.</td></tr>}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function emptyArticleForm() {
    return {
        article_category_id: '',
        title: '',
        excerpt: '',
        content: '',
        featured_image: '',
        meta_title: '',
        meta_description: '',
        status: 'pending',
        external_title: '',
        external_platform: '',
        external_url: '',
        external_price_label: '',
    };
}

function AffiliateContentPage({ token, user, navigate, setNotice, logout }) {
    const [summary, setSummary] = useState(null);
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [form, setForm] = useState(emptyArticleForm());
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [editingArticle, setEditingArticle] = useState(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!token) return;
        loadContent();
    }, [token]);

    async function loadContent() {
        try {
            const [summaryResponse, articleResponse, categoryResponse, productResponse] = await Promise.all([
                apiRequest('/affiliate/content/summary', { token }),
                apiRequest('/affiliate/content/articles', { token }),
                apiRequest('/affiliate/content/categories', { token }),
                apiRequest('/products?per_page=100'),
            ]);

            setSummary(summaryResponse.data);
            setArticles(rowsFrom(articleResponse));
            setCategories(categoryResponse.data || []);
            setProducts(rowsFrom(productResponse));
        } catch (error) {
            setNotice(error.message);
        }
    }

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    function toggleProduct(productId) {
        setSelectedProductIds((current) => {
            const id = String(productId);
            return current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
        });
    }

    function editArticle(article) {
        const external = (article.recommended_products || []).find((item) => !item.product_id) || {};
        setEditingArticle(article);
        setForm({
            article_category_id: article.category?.id || '',
            title: article.title || '',
            excerpt: article.excerpt || '',
            content: article.content || '',
            featured_image: article.featured_image || article.featured_image_url || '',
            meta_title: article.meta_title || '',
            meta_description: article.meta_description || '',
            status: article.status === 'draft' ? 'draft' : 'pending',
            external_title: external.title || '',
            external_platform: external.external_platform || '',
            external_url: external.external_url || '',
            external_price_label: external.price_label || '',
        });
        setSelectedProductIds((article.recommended_products || []).filter((item) => item.product_id).map((item) => String(item.product_id)));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function resetForm() {
        setEditingArticle(null);
        setForm(emptyArticleForm());
        setSelectedProductIds([]);
    }

    async function saveArticle(event) {
        event.preventDefault();
        setSaving(true);

        const recommendations = selectedProductIds.map((productId, index) => ({
            product_id: Number(productId),
            sort_order: index,
        }));

        if (form.external_title || form.external_url) {
            recommendations.push({
                custom_title: form.external_title,
                external_platform: form.external_platform,
                external_url: form.external_url,
                external_price_label: form.external_price_label,
                sort_order: recommendations.length,
            });
        }

        const payload = {
            article_category_id: Number(form.article_category_id),
            title: form.title,
            excerpt: form.excerpt,
            content: form.content,
            featured_image: form.featured_image,
            meta_title: form.meta_title,
            meta_description: form.meta_description,
            status: form.status,
            recommendations,
        };

        try {
            const path = editingArticle ? `/affiliate/content/articles/${editingArticle.id}` : '/affiliate/content/articles';
            await apiRequest(path, { method: editingArticle ? 'PATCH' : 'POST', token, body: payload });
            setNotice(editingArticle ? 'Artikel diperbarui dan menunggu review admin.' : 'Artikel dibuat dan menunggu review admin.');
            resetForm();
            await loadContent();
        } catch (error) {
            setNotice(error.message);
        } finally {
            setSaving(false);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;
    if (!user) return <p className="muted">Memuat akun...</p>;
    if (roleName(user) !== 'customer') return <NeedCustomerAccount logout={logout} />;

    return (
        <section className="content-manager">
            <div className="section-head">
                <div>
                    <p className="eyebrow">Affiliate Content</p>
                    <h1>Content creator dashboard</h1>
                </div>
                <button className="btn ghost" onClick={() => navigate('affiliate-dashboard')}>Affiliate overview</button>
            </div>

            {summary && (
                <div className="stats">
                    <Stat label="My Articles" value={summary.total_articles} />
                    <Stat label="Published" value={summary.published_articles} />
                    <Stat label="Pending" value={summary.pending_articles} />
                    <Stat label="Article Views" value={summary.article_views} />
                    <Stat label="Product Clicks" value={summary.product_clicks} />
                    <Stat label="Estimated Commission" value={formatPrice(summary.estimated_commission)} />
                </div>
            )}

            <div className="manager-layout content-editor-layout">
                <form className="panel form-grid" onSubmit={saveArticle}>
                    <div className="section-head">
                        <div>
                            <p className="eyebrow">{editingArticle ? 'Edit Article' : 'Create Article'}</p>
                            <h2>{editingArticle ? editingArticle.title : 'Artikel baru'}</h2>
                        </div>
                        {editingArticle && <button type="button" className="btn ghost compact-btn" onClick={resetForm}>Batal</button>}
                    </div>
                    <label>
                        <span>Kategori</span>
                        <select value={form.article_category_id} onChange={(event) => update('article_category_id', event.target.value)} required>
                            <option value="">Pilih kategori</option>
                            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>
                    </label>
                    <TextInput label="Title" value={form.title} onChange={(value) => update('title', value)} />
                    <TextInput label="Featured image URL" value={form.featured_image} onChange={(value) => update('featured_image', value)} required={false} />
                    <TextArea label="Excerpt" value={form.excerpt} onChange={(value) => update('excerpt', value)} />
                    <label>
                        <span>Content</span>
                        <textarea value={form.content} onChange={(event) => update('content', event.target.value)} rows="12" required />
                    </label>
                    <div className="grid-2">
                        <TextInput label="Meta title" value={form.meta_title} onChange={(value) => update('meta_title', value)} required={false} />
                        <TextInput label="Meta description" value={form.meta_description} onChange={(value) => update('meta_description', value)} required={false} />
                    </div>
                    <label>
                        <span>Status</span>
                        <select value={form.status} onChange={(event) => update('status', event.target.value)}>
                            <option value="pending">Submit for review</option>
                            <option value="draft">Draft</option>
                        </select>
                    </label>

                    <div className="recommendation-picker">
                        <span>Produk rekomendasi marketplace</span>
                        <div className="product-choice-grid">
                            {products.slice(0, 12).map((product) => (
                                <label className="choice-card" key={product.id}>
                                    <input type="checkbox" checked={selectedProductIds.includes(String(product.id))} onChange={() => toggleProduct(product.id)} />
                                    <span>{product.name}</span>
                                    <small>{formatPrice(product.price)}</small>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="external-product-box">
                        <h3>External affiliate product</h3>
                        <div className="grid-2">
                            <TextInput label="Nama produk" value={form.external_title} onChange={(value) => update('external_title', value)} required={false} />
                            <TextInput label="Platform" value={form.external_platform} onChange={(value) => update('external_platform', value)} required={false} />
                        </div>
                        <TextInput label="Affiliate URL" value={form.external_url} onChange={(value) => update('external_url', value)} required={false} />
                        <TextInput label="Label harga" value={form.external_price_label} onChange={(value) => update('external_price_label', value)} required={false} />
                    </div>

                    <button className="btn primary wide" disabled={saving}>{saving ? 'Menyimpan...' : editingArticle ? 'Update Article' : 'Create Article'}</button>
                </form>

                <div className="stack">
                    <div className="section-head">
                        <div>
                            <p className="eyebrow">My Articles</p>
                            <h2>Article Status</h2>
                        </div>
                    </div>
                    <div className="table-wrap">
                        <table>
                            <thead><tr><th>Artikel</th><th>Status</th><th>Views</th><th>Clicks</th><th>Aksi</th></tr></thead>
                            <tbody>
                                {articles.map((article) => (
                                    <tr key={article.id}>
                                        <td>
                                            <strong>{article.title}</strong>
                                            <p className="muted">{article.category?.name}</p>
                                        </td>
                                        <td>{article.status}</td>
                                        <td>{article.views_count || 0}</td>
                                        <td>{article.clicks_count || 0}</td>
                                        <td>
                                            <div className="actions">
                                                <button className="btn ghost compact-btn" onClick={() => editArticle(article)}>Edit</button>
                                                {article.status === 'published' && <button className="btn ghost compact-btn" onClick={() => navigate('blog-detail', article.slug)}>View</button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {articles.length === 0 && <tr><td colSpan="5">Belum ada artikel.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}

function SellerDashboard({ token, navigate, setNotice }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!token) return;
        apiRequest('/seller/dashboard', { token })
            .then((response) => setData(response.data))
            .catch((error) => setNotice(error.message));
    }, [token, setNotice]);

    if (!token) return <NeedLogin navigate={navigate} />;
    if (!data) return <p className="muted">Memuat dashboard...</p>;

    const maxRevenue = Math.max(...(data.revenue_traffic || []).map((item) => Number(item.revenue || 0)), 1);

    return (
        <section>
            <p className="eyebrow">Seller dashboard</p>
            <h1>{data.seller.store_name}</h1>
            <div className="stats">
                <Stat label="Total produk" value={data.total_products} />
                <Stat label="Order masuk" value={data.total_orders} />
                <Stat label="Order pending" value={data.pending_orders} />
                <Stat label="Revenue" value={formatPrice(data.total_revenue)} />
            </div>
            <div className="panel revenue-panel">
                <div className="section-head">
                    <div>
                        <p className="eyebrow">Traffic pendapatan</p>
                        <h2>Revenue 14 hari terakhir</h2>
                    </div>
                </div>
                <div className="revenue-chart">
                    {(data.revenue_traffic || []).map((item) => (
                        <div className="revenue-bar" key={item.date}>
                            <div className="bar-track">
                                <span style={{ height: `${Math.max(6, (Number(item.revenue || 0) / maxRevenue) * 100)}%` }} />
                            </div>
                            <small>{new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</small>
                            <strong>{formatPrice(item.revenue)}</strong>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function SellerProducts({ token, navigate, setNotice }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [editing, setEditing] = useState(null);

    useEffect(() => {
        apiRequest('/categories').then((data) => setCategories(data.data));
        if (token) loadProducts();
    }, [token]);

    async function loadProducts() {
        const data = await apiRequest('/seller/products', { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setProducts(data.data || []);
    }

    async function saveProduct(formData, productId) {
        try {
            await apiRequest(productId ? `/seller/products/${productId}` : '/seller/products', {
                method: 'POST',
                token,
                body: formData,
                isForm: true,
            });
            setEditing(null);
            setNotice(productId ? 'Produk diperbarui.' : 'Produk dibuat.');
            loadProducts();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function deleteProduct(product) {
        const confirmed = window.confirm(`Hapus produk "${product.name}"? Produk akan hilang dari katalog dan tidak bisa dibeli lagi.`);

        if (!confirmed) return;

        try {
            await apiRequest(`/seller/products/${product.id}`, { method: 'DELETE', token });
            setNotice(`Produk "${product.name}" berhasil dihapus dari katalog.`);
            loadProducts();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section className="manager-layout">
            <div>
                <p className="eyebrow">Produk seller</p>
                <h1>Manajemen produk</h1>
                <ProductForm categories={categories} product={editing} onSubmit={saveProduct} />
            </div>
            <div className="stack">
                {products.map((product) => (
                    <div className="line-item" key={product.id}>
                        <ProductImage product={product} small />
                        <div>
                            <strong>{product.name}</strong>
                            <p className="muted">{formatPrice(product.price)} - stock {product.stock} - {product.status}</p>
                        </div>
                        <button className="btn ghost" onClick={() => setEditing(product)}>Edit</button>
                        <button className="btn danger" onClick={() => deleteProduct(product)}>Hapus produk</button>
                    </div>
                ))}
            </div>
        </section>
    );
}

function ProductForm({ categories, product, onSubmit }) {
    const [form, setForm] = useState(defaultProductForm(product));
    const [file, setFile] = useState(null);

    useEffect(() => {
        setForm(defaultProductForm(product));
        setFile(null);
    }, [product]);

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    function submit(event) {
        event.preventDefault();
        const payload = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (key === 'weight_unit') return;
            if (key === 'weight') {
                const grams = form.weight_unit === 'kg'
                    ? Math.round(Number(value || 0) * 1000)
                    : Number(value || 0);
                payload.append('weight', grams);
                return;
            }
            payload.append(key, value);
        });
        if (file) payload.append('image', file);
        onSubmit(payload, product?.id);
    }

    const hasCustomBrewing = form.brewing_method && !BREWING_OPTIONS.some((option) => option.value === form.brewing_method);

    return (
        <form className="panel form-grid" onSubmit={submit}>
            <h2>{product ? 'Edit produk' : 'Tambah produk'}</h2>
            <select value={form.category_id} onChange={(event) => update('category_id', event.target.value)} required>
                <option value="">Pilih kategori</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <TextInput label="Nama" value={form.name} onChange={(value) => update('name', value)} />
            <TextArea label="Deskripsi" value={form.description} onChange={(value) => update('description', value)} />
            <div className="grid-2">
                <TextInput label="Harga" type="number" value={form.price} onChange={(value) => update('price', value)} />
                <TextInput label="Stock" type="number" value={form.stock} onChange={(value) => update('stock', value)} />
                <div className="unit-row">
                    <TextInput label="Berat" type="number" value={form.weight} onChange={(value) => update('weight', value)} />
                    <label>
                        <span>Satuan</span>
                        <select value={form.weight_unit} onChange={(event) => update('weight_unit', event.target.value)}>
                            <option value="gram">Gram</option>
                            <option value="kg">Kg</option>
                        </select>
                    </label>
                </div>
                <label>
                    <span>Roast level</span>
                    <select value={form.roast_level} onChange={(event) => update('roast_level', event.target.value)} required>
                        <option value="">Pilih roast level</option>
                        {ROAST_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
                <TextInput label="Origin" value={form.origin} onChange={(value) => update('origin', value)} />
                <label>
                    <span>Brewing</span>
                    <select value={form.brewing_method} onChange={(event) => update('brewing_method', event.target.value)}>
                        <option value="">Pilih brewing</option>
                        {hasCustomBrewing && <option value={form.brewing_method}>{form.brewing_method}</option>}
                        {BREWING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
            </div>
            <select value={form.status} onChange={(event) => update('status', event.target.value)}>
                {PRODUCT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <input type="file" accept="image/*" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            <button className="btn primary wide">{product ? 'Simpan perubahan' : 'Tambah produk'}</button>
        </form>
    );
}

function defaultProductForm(product) {
    return {
        category_id: product?.category_id || '',
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || '',
        stock: product?.stock || '',
        weight: product?.weight >= 1000 ? Number(product.weight) / 1000 : product?.weight || '',
        weight_unit: product?.weight >= 1000 ? 'kg' : 'gram',
        roast_level: product?.roast_level || '',
        origin: product?.origin || '',
        brewing_method: product?.brewing_method || '',
        status: product?.status || 'active',
    };
}

function SellerOrders({ token, navigate, setNotice, refreshSellerNotifications }) {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!token) return;
        loadOrders();
    }, [token]);

    async function loadOrders() {
        const data = await apiRequest('/seller/orders', { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setOrders(data.data || []);
    }

    async function updateStatus(order, status) {
        try {
            await apiRequest(`/seller/orders/${order.id}/status`, { method: 'PATCH', token, body: { status } });
            setNotice(`Order ${order.order_number} menjadi ${status}.`);
            await loadOrders();
            refreshSellerNotifications?.();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section>
            <p className="eyebrow">Order seller</p>
            <h1>Order masuk</h1>
            <div className="stack">
                {orders.map((order) => (
                    <div className="panel order-panel" key={order.id}>
                        <div className="row between">
                            <div>
                                <strong>{order.order_number}</strong>
                                <p className="muted">{order.customer_name} - {order.status}</p>
                            </div>
                            <strong>{formatPrice(order.seller_total)}</strong>
                        </div>
                        {order.items.map((item) => (
                            <p className="muted" key={item.id}>{item.product_name} x {item.quantity} - {item.status}</p>
                        ))}
                        <div className="row">
                            {['processing', 'shipped', 'completed'].map((status) => (
                                <button className="btn ghost" key={status} onClick={() => updateStatus(order, status)}>{status}</button>
                            ))}
                        </div>
                    </div>
                ))}
                {orders.length === 0 && <p className="muted">Belum ada order untuk produk seller ini.</p>}
            </div>
        </section>
    );
}

function AdminLayout({ current, navigate, children }) {
    const items = [
        ['admin-dashboard', 'Dashboard'],
        ['admin-users', 'Users'],
        ['admin-sellers', 'Sellers'],
        ['admin-categories', 'Categories'],
        ['admin-products', 'Products'],
        ['admin-orders', 'Orders'],
        ['admin-payments', 'Payments'],
        ['admin-content', 'Content'],
        ['admin-affiliates', 'Affiliates'],
        ['admin-affiliate-commissions', 'Commissions'],
        ['admin-reports', 'Reports'],
    ];

    return (
        <section className="admin-layout">
            <aside className="admin-sidebar">
                <strong>Admin</strong>
                {items.map(([view, label]) => (
                    <button key={view} className={current === view ? 'active' : ''} onClick={() => navigate(view)}>{label}</button>
                ))}
            </aside>
            <div className="admin-content">{children}</div>
        </section>
    );
}

function AdminDashboardPage({ token, navigate, setNotice }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!token) return;
        apiRequest('/admin/dashboard', { token })
            .then((response) => setData(response.data))
            .catch((error) => setNotice(error.message));
    }, [token, setNotice]);

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-dashboard" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Dashboard" />
            {!data ? <p className="muted">Memuat admin dashboard...</p> : (
                <div className="stats">
                    <Stat label="Total users" value={data.total_users} />
                    <Stat label="Customers" value={data.total_customers} />
                    <Stat label="Sellers" value={data.total_sellers} />
                    <Stat label="Products" value={data.total_products} />
                    <Stat label="Orders" value={data.total_orders} />
                    <Stat label="Revenue" value={formatPrice(data.total_revenue)} />
                    <Stat label="Pending orders" value={data.pending_orders} />
                    <Stat label="Seller approvals" value={data.pending_seller_approvals} />
                    <Stat label="Affiliates" value={data.total_affiliates} />
                    <Stat label="Pending commissions" value={data.pending_affiliate_commissions} />
                    <Stat label="Affiliate amount" value={formatPrice(data.affiliate_commission_amount)} />
                    <Stat label="Articles" value={data.total_articles} />
                    <Stat label="Published articles" value={data.published_articles} />
                    <Stat label="Pending articles" value={data.pending_articles} />
                </div>
            )}
        </AdminLayout>
    );
}

function AdminUsersPage({ token, navigate, setNotice }) {
    const [users, setUsers] = useState([]);
    const [filters, setFilters] = useState({ role: '', status: '' });
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        if (!token) return;
        loadUsers();
    }, [token, filters.role, filters.status]);

    async function loadUsers() {
        const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
        const response = await apiRequest(`/admin/users?${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setUsers(rowsFrom(response));
    }

    async function updateUser(user, patch) {
        try {
            await apiRequest(`/admin/users/${user.id}`, { method: 'PATCH', token, body: patch });
            setNotice('User diperbarui.');
            loadUsers();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function showUser(user) {
        const response = await apiRequest(`/admin/users/${user.id}`, { token }).catch((error) => {
            setNotice(error.message);
            return null;
        });
        if (response) setDetail(response.data);
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-users" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="User management" />
            <div className="filters compact">
                <select value={filters.role} onChange={(event) => setFilters({ ...filters, role: event.target.value })}>
                    <option value="">Semua role</option>
                    {USER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                    <option value="">Semua status</option>
                    {USER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <select value={user.role?.name || ''} onChange={(event) => updateUser(user, { role: event.target.value })}>
                                        {USER_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                                    </select>
                                </td>
                                <td>
                                    <select value={user.status || 'active'} onChange={(event) => updateUser(user, { status: event.target.value })}>
                                        {USER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </td>
                                <td><button className="btn ghost" onClick={() => showUser(user)}>Detail</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {detail && <DetailPanel title={detail.name} rows={[
                ['Email', detail.email],
                ['Role', detail.role?.name],
                ['Status', detail.status],
                ['Seller', detail.seller_profile?.store_name || '-'],
            ]} />}
        </AdminLayout>
    );
}

function AdminSellersPage({ token, navigate, setNotice }) {
    const [sellers, setSellers] = useState([]);
    const [status, setStatus] = useState('');
    const [detail, setDetail] = useState(null);

    useEffect(() => {
        if (!token) return;
        loadSellers();
    }, [token, status]);

    async function loadSellers() {
        const query = status ? `?status=${status}` : '';
        const response = await apiRequest(`/admin/sellers${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setSellers(rowsFrom(response));
    }

    async function sellerAction(seller, action) {
        try {
            await apiRequest(`/admin/sellers/${seller.id}/${action}`, { method: 'POST', token });
            setNotice('Status seller diperbarui.');
            loadSellers();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function showSeller(seller) {
        const response = await apiRequest(`/admin/sellers/${seller.id}`, { token }).catch((error) => {
            setNotice(error.message);
            return null;
        });
        if (response) setDetail(response.data);
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-sellers" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Seller management" />
            <div className="filters compact">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">Semua status</option>
                    {SELLER_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Toko</th><th>User</th><th>Status</th><th>Produk</th><th>Order</th><th>Revenue</th><th>Aksi</th></tr></thead>
                    <tbody>
                        {sellers.map((seller) => (
                            <tr key={seller.id}>
                                <td>{seller.store_name}</td>
                                <td>{seller.user?.email}</td>
                                <td>{seller.status}</td>
                                <td>{seller.products_count}</td>
                                <td>{seller.total_orders}</td>
                                <td>{formatPrice(seller.total_revenue)}</td>
                                <td className="actions">
                                    <button className="btn ghost" onClick={() => showSeller(seller)}>Detail</button>
                                    <button className="btn ghost" onClick={() => sellerAction(seller, 'approve')}>Approve</button>
                                    <button className="btn ghost" onClick={() => sellerAction(seller, 'reject')}>Reject</button>
                                    <button className="btn danger" onClick={() => sellerAction(seller, 'suspend')}>Suspend</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {detail && <DetailPanel title={detail.store_name} rows={[
                ['Pemilik', detail.user?.name],
                ['Email', detail.user?.email],
                ['Telepon', detail.phone || '-'],
                ['Status', detail.status],
                ['Total produk', detail.products_count],
                ['Total order', detail.total_orders],
                ['Revenue', formatPrice(detail.total_revenue)],
            ]} />}
        </AdminLayout>
    );
}

function AdminCategoriesPage({ token, navigate, setNotice }) {
    const [categories, setCategories] = useState([]);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', description: '' });

    useEffect(() => {
        if (!token) return;
        loadCategories();
    }, [token]);

    function editCategory(category) {
        setEditing(category);
        setForm({ name: category.name, description: category.description || '' });
    }

    async function loadCategories() {
        const response = await apiRequest('/admin/categories', { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setCategories(rowsFrom(response));
    }

    async function saveCategory(event) {
        event.preventDefault();
        const path = editing ? `/admin/categories/${editing.id}` : '/admin/categories';
        const method = editing ? 'PUT' : 'POST';

        try {
            await apiRequest(path, { method, token, body: form });
            setNotice(editing ? 'Kategori diperbarui.' : 'Kategori dibuat.');
            setEditing(null);
            setForm({ name: '', description: '' });
            loadCategories();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function deleteCategory(category) {
        await apiRequest(`/admin/categories/${category.id}`, { method: 'DELETE', token })
            .then(() => {
                setNotice('Kategori dihapus.');
                loadCategories();
            })
            .catch((error) => setNotice(error.message));
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-categories" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Category management" />
            <form className="panel form-grid admin-form" onSubmit={saveCategory}>
                <TextInput label="Nama kategori" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                <TextArea label="Deskripsi" value={form.description} onChange={(value) => setForm({ ...form, description: value })} />
                <button className="btn primary">{editing ? 'Simpan kategori' : 'Tambah kategori'}</button>
            </form>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Nama</th><th>Slug</th><th>Produk</th><th>Aksi</th></tr></thead>
                    <tbody>
                        {categories.map((category) => (
                            <tr key={category.id}>
                                <td>{category.name}</td>
                                <td>{category.slug}</td>
                                <td>{category.products_count}</td>
                                <td className="actions">
                                    <button className="btn ghost" onClick={() => editCategory(category)}>Edit</button>
                                    <button className="btn danger" onClick={() => deleteCategory(category)}>Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function AdminProductsPage({ token, navigate, setNotice }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [filters, setFilters] = useState({ status: '', category_id: '', seller_id: '' });

    useEffect(() => {
        if (!token) return;
        apiRequest('/admin/categories', { token }).then((response) => setCategories(rowsFrom(response))).catch(() => {});
        apiRequest('/admin/sellers', { token }).then((response) => setSellers(rowsFrom(response))).catch(() => {});
    }, [token]);

    useEffect(() => {
        if (!token) return;
        loadProducts();
    }, [token, filters.status, filters.category_id, filters.seller_id]);

    async function loadProducts() {
        const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
        const response = await apiRequest(`/admin/products?${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setProducts(rowsFrom(response));
    }

    async function updateProductStatus(product, status) {
        try {
            await apiRequest(`/admin/products/${product.id}/status`, { method: 'PATCH', token, body: { status } });
            setNotice('Status produk diperbarui.');
            loadProducts();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-products" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Product monitoring" />
            <div className="filters compact">
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                    <option value="">Semua status</option>
                    {PRODUCT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <select value={filters.category_id} onChange={(event) => setFilters({ ...filters, category_id: event.target.value })}>
                    <option value="">Semua kategori</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
                <select value={filters.seller_id} onChange={(event) => setFilters({ ...filters, seller_id: event.target.value })}>
                    <option value="">Semua seller</option>
                    {sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.store_name}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Produk</th><th>Seller</th><th>Kategori</th><th>Harga</th><th>Stock</th><th>Status</th></tr></thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td>{product.name}</td>
                                <td>{product.seller?.store_name}</td>
                                <td>{product.category?.name}</td>
                                <td>{formatPrice(product.price)}</td>
                                <td>{product.stock}</td>
                                <td>
                                    <select value={product.status} onChange={(event) => updateProductStatus(product, event.target.value)}>
                                        {PRODUCT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function AdminOrdersPage({ token, navigate, setNotice }) {
    const [orders, setOrders] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [filters, setFilters] = useState({ status: '', seller_id: '' });

    useEffect(() => {
        if (!token) return;
        apiRequest('/admin/sellers', { token }).then((response) => setSellers(rowsFrom(response))).catch(() => {});
    }, [token]);

    useEffect(() => {
        if (!token) return;
        loadOrders();
    }, [token, filters.status, filters.seller_id]);

    async function loadOrders() {
        const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
        const response = await apiRequest(`/admin/orders?${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setOrders(rowsFrom(response));
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-orders" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Order monitoring" />
            <div className="filters compact">
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
                    <option value="">Semua status</option>
                    {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <select value={filters.seller_id} onChange={(event) => setFilters({ ...filters, seller_id: event.target.value })}>
                    <option value="">Semua seller</option>
                    {sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.store_name}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Order</th><th>Customer</th><th>Seller</th><th>Item</th><th>Total</th><th>Status</th></tr></thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td>{order.order_number}</td>
                                <td>{order.user?.email || order.customer_name}</td>
                                <td>{[...new Set(order.items?.map((item) => item.seller?.store_name).filter(Boolean))].join(', ')}</td>
                                <td>{order.items?.length || 0}</td>
                                <td>{formatPrice(order.total_amount)}</td>
                                <td>{order.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function AdminPaymentsPage({ token, navigate, setNotice }) {
    const [payments, setPayments] = useState([]);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (!token) return;
        loadPayments();
    }, [token, status]);

    async function loadPayments() {
        const query = status ? `?status=${status}` : '';
        const response = await apiRequest(`/admin/payments${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setPayments(rowsFrom(response));
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-payments" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Payment monitoring" />
            <div className="filters compact">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">Semua status</option>
                    {PAYMENT_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Order ID</th><th>Transaction</th><th>Method</th><th>Status</th><th>Gross amount</th><th>Paid at</th></tr></thead>
                    <tbody>
                        {payments.map((payment) => (
                            <tr key={payment.id}>
                                <td>{payment.gateway_order_id}</td>
                                <td>{payment.transaction_id || '-'}</td>
                                <td>{payment.payment_type || payment.payment_gateway}</td>
                                <td>{payment.status}</td>
                                <td>{formatPrice(payment.amount)}</td>
                                <td>{payment.paid_at ? new Date(payment.paid_at).toLocaleString('id-ID') : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function AdminAffiliatesPage({ token, navigate, setNotice }) {
    const [affiliates, setAffiliates] = useState([]);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (!token) return;
        loadAffiliates();
    }, [token, status]);

    async function loadAffiliates() {
        const query = status ? `?status=${status}` : '';
        const response = await apiRequest(`/admin/affiliates${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setAffiliates(rowsFrom(response));
    }

    async function updateAffiliate(affiliate, patch) {
        try {
            await apiRequest(`/admin/affiliates/${affiliate.id}`, { method: 'PATCH', token, body: patch });
            setNotice('Affiliate diperbarui.');
            loadAffiliates();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-affiliates" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Affiliate monitoring" />
            <div className="filters compact">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">Semua status</option>
                    {AFFILIATE_PROFILE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>User</th><th>Kode</th><th>Rate</th><th>Klik</th><th>Konversi</th><th>Total komisi</th><th>Status</th></tr></thead>
                    <tbody>
                        {affiliates.map((affiliate) => (
                            <tr key={affiliate.id}>
                                <td>{affiliate.affiliate_name || affiliate.user?.email}</td>
                                <td>{affiliate.code}</td>
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={affiliate.commission_rate}
                                        onChange={(event) => updateAffiliate(affiliate, { commission_rate: Number(event.target.value) })}
                                    />
                                </td>
                                <td>{affiliate.clicks_count}</td>
                                <td>{affiliate.summary?.total_conversions || 0}</td>
                                <td>{formatPrice(affiliate.summary?.total_commission)}</td>
                                <td>
                                    <select value={affiliate.status} onChange={(event) => updateAffiliate(affiliate, { status: event.target.value })}>
                                        {AFFILIATE_PROFILE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function AdminAffiliateCommissionsPage({ token, navigate, setNotice }) {
    const [commissions, setCommissions] = useState([]);
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (!token) return;
        loadCommissions();
    }, [token, status]);

    async function loadCommissions() {
        const query = status ? `?status=${status}` : '';
        const response = await apiRequest(`/admin/affiliate-commissions${query}`, { token }).catch((error) => {
            setNotice(error.message);
            return { data: [] };
        });
        setCommissions(rowsFrom(response));
    }

    async function updateCommission(commission, nextStatus) {
        try {
            await apiRequest(`/admin/affiliate-commissions/${commission.id}`, { method: 'PATCH', token, body: { status: nextStatus } });
            setNotice('Status komisi diperbarui.');
            loadCommissions();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-affiliate-commissions" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Affiliate commissions" />
            <div className="filters compact">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">Semua status</option>
                    {AFFILIATE_COMMISSION_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
            </div>
            <div className="table-wrap">
                <table>
                    <thead><tr><th>Affiliate</th><th>Order</th><th>Produk</th><th>Seller</th><th>Subtotal</th><th>Komisi</th><th>Status</th></tr></thead>
                    <tbody>
                        {commissions.map((commission) => (
                            <tr key={commission.id}>
                                <td>{commission.affiliate_profile?.code} - {commission.affiliate_profile?.user?.email}</td>
                                <td>{commission.order?.order_number}</td>
                                <td>{commission.product?.name || '-'}</td>
                                <td>{commission.seller?.store_name || '-'}</td>
                                <td>{formatPrice(commission.amount)}</td>
                                <td>{formatPrice(commission.commission_amount)}</td>
                                <td>
                                    <select value={commission.status} onChange={(event) => updateCommission(commission, event.target.value)}>
                                        {AFFILIATE_COMMISSION_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}

function AdminContentPage({ token, navigate, setNotice }) {
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]);
    const [status, setStatus] = useState('');
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
    const [editingArticle, setEditingArticle] = useState(null);
    const [form, setForm] = useState({
        article_category_id: '',
        title: '',
        excerpt: '',
        content: '',
        featured_image: '',
        meta_title: '',
        meta_description: '',
        status: 'pending',
        is_featured: false,
        featured_rank: 0,
    });

    useEffect(() => {
        if (!token) return;
        loadContent();
    }, [token, status]);

    async function loadContent() {
        const query = status ? `?status=${status}` : '';
        try {
            const [articleResponse, categoryResponse] = await Promise.all([
                apiRequest(`/admin/content/articles${query}`, { token }),
                apiRequest('/admin/content/categories', { token }),
            ]);
            setArticles(rowsFrom(articleResponse));
            setCategories(categoryResponse.data || []);
        } catch (error) {
            setNotice(error.message);
        }
    }

    function editArticle(article) {
        setEditingArticle(article);
        setForm({
            article_category_id: article.category?.id || '',
            title: article.title || '',
            excerpt: article.excerpt || '',
            content: article.content || '',
            featured_image: article.featured_image || article.featured_image_url || '',
            meta_title: article.meta_title || '',
            meta_description: article.meta_description || '',
            status: article.status || 'pending',
            is_featured: Boolean(article.is_featured),
            featured_rank: article.featured_rank || 0,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    async function saveArticle(event) {
        event.preventDefault();
        if (!editingArticle) return;

        try {
            await apiRequest(`/admin/content/articles/${editingArticle.id}`, {
                method: 'PATCH',
                token,
                body: {
                    ...form,
                    article_category_id: Number(form.article_category_id),
                    featured_rank: Number(form.featured_rank || 0),
                },
            });
            setNotice('Artikel diperbarui.');
            setEditingArticle(null);
            await loadContent();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function approveArticle(article) {
        try {
            await apiRequest(`/admin/content/articles/${article.id}/approve`, { method: 'POST', token });
            setNotice('Artikel dipublish.');
            loadContent();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function rejectArticle(article) {
        const reason = window.prompt('Alasan reject artikel:', article.rejection_reason || '');
        if (reason === null) return;

        try {
            await apiRequest(`/admin/content/articles/${article.id}/reject`, { method: 'POST', token, body: { rejection_reason: reason } });
            setNotice('Artikel ditolak.');
            loadContent();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function toggleFeatured(article) {
        try {
            await apiRequest(`/admin/content/articles/${article.id}`, {
                method: 'PATCH',
                token,
                body: {
                    is_featured: !article.is_featured,
                    featured_rank: article.featured_rank || 0,
                },
            });
            setNotice('Featured content diperbarui.');
            loadContent();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function createCategory(event) {
        event.preventDefault();
        try {
            await apiRequest('/admin/content/categories', { method: 'POST', token, body: categoryForm });
            setCategoryForm({ name: '', description: '' });
            setNotice('Kategori konten dibuat.');
            loadContent();
        } catch (error) {
            setNotice(error.message);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-content" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Content Management" />
            <div className="filters compact">
                <select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option value="">All Articles</option>
                    {ARTICLE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
                <button className="btn ghost" onClick={() => setStatus('pending')}>Pending Articles</button>
            </div>

            {editingArticle && (
                <form className="panel form-grid" onSubmit={saveArticle}>
                    <div className="section-head">
                        <div>
                            <p className="eyebrow">Edit Article</p>
                            <h2>{editingArticle.title}</h2>
                        </div>
                        <button type="button" className="btn ghost compact-btn" onClick={() => setEditingArticle(null)}>Tutup</button>
                    </div>
                    <label>
                        <span>Kategori</span>
                        <select value={form.article_category_id} onChange={(event) => update('article_category_id', event.target.value)} required>
                            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>
                    </label>
                    <TextInput label="Title" value={form.title} onChange={(value) => update('title', value)} />
                    <TextInput label="Featured image URL" value={form.featured_image} onChange={(value) => update('featured_image', value)} required={false} />
                    <TextArea label="Excerpt" value={form.excerpt} onChange={(value) => update('excerpt', value)} />
                    <label>
                        <span>Content</span>
                        <textarea rows="10" value={form.content} onChange={(event) => update('content', event.target.value)} required />
                    </label>
                    <div className="grid-2">
                        <TextInput label="Meta title" value={form.meta_title} onChange={(value) => update('meta_title', value)} required={false} />
                        <TextInput label="Meta description" value={form.meta_description} onChange={(value) => update('meta_description', value)} required={false} />
                    </div>
                    <div className="grid-2">
                        <label>
                            <span>Status</span>
                            <select value={form.status} onChange={(event) => update('status', event.target.value)}>
                                {ARTICLE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </label>
                        <TextInput label="Featured rank" type="number" value={form.featured_rank} onChange={(value) => update('featured_rank', value)} required={false} />
                    </div>
                    <label className="inline-check">
                        <input type="checkbox" checked={form.is_featured} onChange={(event) => update('is_featured', event.target.checked)} />
                        <span>Featured content</span>
                    </label>
                    <button className="btn primary">Simpan artikel</button>
                </form>
            )}

            <div className="table-wrap">
                <table>
                    <thead><tr><th>Artikel</th><th>Author</th><th>Status</th><th>Views</th><th>Clicks</th><th>Featured</th><th>Aksi</th></tr></thead>
                    <tbody>
                        {articles.map((article) => (
                            <tr key={article.id}>
                                <td>
                                    <strong>{article.title}</strong>
                                    <p className="muted">{article.category?.name}</p>
                                </td>
                                <td>{article.author?.creator_profile?.display_name || article.author?.name}</td>
                                <td>{article.status}</td>
                                <td>{article.views_count || 0}</td>
                                <td>{article.clicks_count || 0}</td>
                                <td>
                                    <button className="btn ghost compact-btn" onClick={() => toggleFeatured(article)}>
                                        {article.is_featured ? 'Featured' : 'Normal'}
                                    </button>
                                </td>
                                <td>
                                    <div className="actions">
                                        <button className="btn ghost compact-btn" onClick={() => editArticle(article)}>Edit</button>
                                        <button className="btn primary compact-btn" onClick={() => approveArticle(article)}>Approve</button>
                                        <button className="btn danger compact-btn" onClick={() => rejectArticle(article)}>Reject</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {articles.length === 0 && <tr><td colSpan="7">Belum ada artikel.</td></tr>}
                    </tbody>
                </table>
            </div>

            <div className="admin-split">
                <form className="panel form-grid" onSubmit={createCategory}>
                    <div>
                        <p className="eyebrow">Manage Categories</p>
                        <h2>Kategori artikel</h2>
                    </div>
                    <TextInput label="Nama kategori" value={categoryForm.name} onChange={(value) => setCategoryForm({ ...categoryForm, name: value })} />
                    <TextArea label="Deskripsi" value={categoryForm.description} onChange={(value) => setCategoryForm({ ...categoryForm, description: value })} />
                    <button className="btn primary">Tambah kategori</button>
                </form>
                <div className="panel">
                    <p className="eyebrow">Existing</p>
                    <h2>Content categories</h2>
                    <div className="category-list">
                        {categories.map((category) => (
                            <div className="category-row" key={category.id}>
                                <span>{category.name}</span>
                                <small>{category.articles_count || 0} artikel</small>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function AdminReportsPage({ token, navigate, setNotice }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        if (!token) return;
        apiRequest('/admin/reports', { token })
            .then((response) => setData(response.data))
            .catch((error) => setNotice(error.message));
    }, [token, setNotice]);

    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <AdminLayout current="admin-reports" navigate={navigate}>
            <PageTitle eyebrow="Admin" title="Reports" />
            {!data ? <p className="muted">Memuat reports...</p> : (
                <>
                    <div className="stats">
                        <Stat label="Revenue bulan ini" value={formatPrice(data.monthly_revenue)} />
                        <Stat label="Order bulan ini" value={data.monthly_orders} />
                        <Stat label="Customer baru" value={data.monthly_new_customers} />
                        <Stat label="Komisi affiliate" value={formatPrice(data.monthly_affiliate_commission)} />
                    </div>
                    <div className="admin-split">
                        <ReportTable title="Produk terlaris" rows={data.best_selling_products} nameKey="product_name" />
                        <ReportTable title="Seller top revenue" rows={data.top_sellers} nameKey="store_name" />
                        <ReportTable title="Affiliate top commission" rows={data.top_affiliates} nameKey="code" amountKey="total_commission" />
                    </div>
                </>
            )}
        </AdminLayout>
    );
}

function ReportTable({ title, rows, nameKey, amountKey = 'total_revenue' }) {
    return (
        <div className="panel">
            <h2>{title}</h2>
            <div className="table-wrap flat">
                <table>
                    <thead><tr><th>Nama</th><th>Order/Qty</th><th>Revenue</th></tr></thead>
                    <tbody>
                        {(rows || []).map((row, index) => (
                            <tr key={`${row[nameKey]}-${index}`}>
                                <td>{row[nameKey]}</td>
                                <td>{row.total_quantity || row.total_orders || 0}</td>
                                <td>{formatPrice(row[amountKey])}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PageTitle({ eyebrow, title }) {
    return (
        <div className="section-head">
            <div>
                <p className="eyebrow">{eyebrow}</p>
                <h1>{title}</h1>
            </div>
        </div>
    );
}

function DetailPanel({ title, rows }) {
    return (
        <div className="panel detail-panel">
            <h2>{title}</h2>
            <dl className="specs compact-specs">
                {rows.map(([label, value]) => (
                    <div key={label}><dt>{label}</dt><dd>{value || '-'}</dd></div>
                ))}
            </dl>
        </div>
    );
}

function OrderCard({ order }) {
    return (
        <div className="panel order-panel">
            <div className="row between">
                <div>
                    <strong>{order.order_number}</strong>
                    <p className="muted">{order.status} - {new Date(order.created_at).toLocaleString('id-ID')}</p>
                </div>
                <strong>{formatPrice(order.total_amount)}</strong>
            </div>
            {order.items?.map((item) => (
                <p className="muted" key={item.id}>{item.product_name} x {item.quantity} - {item.status}</p>
            ))}
            {order.payment && <p className="muted">Payment: {order.payment.status} {order.payment.payment_type ? `via ${order.payment.payment_type}` : ''}</p>}
        </div>
    );
}

function ProductImage({ product, large = false, small = false }) {
    const src = product.image_url || product.image;
    const className = large ? 'product-image large' : small ? 'product-image small' : 'product-image';

    if (src) {
        return <img className={className} src={src} alt={product.name} />;
    }

    return <div className={`${className} placeholder`}>{product.name?.slice(0, 1) || 'K'}</div>;
}

function TextInput({ label, value, onChange, type = 'text', required = true }) {
    return (
        <label>
            <span>{label}</span>
            <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
        </label>
    );
}

function TextArea({ label, value, onChange }) {
    return (
        <label>
            <span>{label}</span>
            <textarea value={value} onChange={(event) => onChange(event.target.value)} rows="4" />
        </label>
    );
}

function Stat({ label, value }) {
    return (
        <div className="stat">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function NeedLogin({ navigate }) {
    function goLogin() {
        rememberCurrentRoute();
        navigate('login');
    }

    return (
        <div className="panel empty-state">
            <h1>Login diperlukan</h1>
            <p className="muted">Masuk dengan role yang sesuai untuk membuka halaman ini.</p>
            <button className="btn primary" onClick={goLogin}>Login</button>
        </div>
    );
}

function NeedCustomerAccount({ logout }) {
    return (
        <div className="panel empty-state">
            <h1>Akun customer diperlukan</h1>
            <p className="muted">Affiliate hanya tersedia untuk akun customer. Logout lalu masuk dengan akun customer untuk membuka dashboard affiliate.</p>
            <button className="btn primary" onClick={() => logout()}>Logout</button>
        </div>
    );
}

export default App;
