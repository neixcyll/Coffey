import { useEffect, useState } from 'react';
import Header from './components/common/Header.jsx';
import NeedLogin from './components/common/NeedLogin.jsx';
import { apiRequest } from './services/api.js';
import { affiliateRefFromUrl, defaultLandingFor, parseRoute, publicPathFor, rememberCurrentRoute, roleName } from './utils/route.js';
import AuthPage from './pages/auth/AuthPage.jsx';
import AffiliateContentPage from './pages/affiliate/AffiliateContentPage.jsx';
import AffiliateDashboardPage from './pages/affiliate/AffiliateDashboardPage.jsx';
import AdminAffiliateCommissionsPage from './pages/admin/AdminAffiliateCommissionsPage.jsx';
import AdminAffiliatesPage from './pages/admin/AdminAffiliatesPage.jsx';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage.jsx';
import AdminContentPage from './pages/admin/AdminContentPage.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage.jsx';
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';
import AdminSellersPage from './pages/admin/AdminSellersPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import CartPage from './pages/customer/CartPage.jsx';
import CheckoutPage from './pages/customer/CheckoutPage.jsx';
import OrderHistory from './pages/customer/OrderHistory.jsx';
import UserDashboardPage from './pages/customer/UserDashboardPage.jsx';
import BlogArticlePage from './pages/public/BlogArticlePage.jsx';
import BlogIndexPage from './pages/public/BlogIndexPage.jsx';
import CatalogPage from './pages/public/CatalogPage.jsx';
import CreatorPage from './pages/public/CreatorPage.jsx';
import ProductDetail from './pages/public/ProductDetail.jsx';
import SellerDashboard from './pages/seller/SellerDashboard.jsx';
import SellerLayout from './pages/seller/SellerLayout.jsx';
import SellerOrders from './pages/seller/SellerOrders.jsx';
import SellerProfile from './pages/seller/SellerProfile.jsx';
import SellerProducts from './pages/seller/SellerProducts.jsx';
import SellerReviews from './pages/seller/SellerReviews.jsx';

const SELLER_VIEWS = [
    'seller-dashboard',
    'seller-profile',
    'seller-products',
    'seller-orders',
    'seller-reviews',
];

const ADMIN_VIEWS = [
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
];

export default function App() {
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
    const isSellerRoute = SELLER_VIEWS.includes(route.view);
    const isAdminRoute = ADMIN_VIEWS.includes(route.view);

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

    useEffect(() => {
        if (!isSellerRoute) return;

        if (!token) {
            rememberCurrentRoute();
            navigate('login');
            return;
        }

        if (user && roleName(user) !== 'seller') {
            setNotice('Halaman seller hanya untuk akun seller.');
            navigate(defaultLandingFor(user));
        }
    }, [isSellerRoute, token, user?.role?.name]);

    useEffect(() => {
        if (!isAdminRoute) return;

        if (!token) {
            rememberCurrentRoute();
            navigate('login');
            return;
        }

        if (user && roleName(user) !== 'admin') {
            setNotice('Halaman admin hanya untuk akun admin.');
            navigate(defaultLandingFor(user));
        }
    }, [isAdminRoute, token, user?.role?.name]);

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

    function updateCurrentUser(nextUser) {
        setUser(nextUser);
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
        notice,
        setNotice,
        saveSession,
        logout,
        refreshCartCount,
        refreshSellerNotifications,
        updateCurrentUser,
    };

    function renderSellerPage() {
        if (!token) return <NeedLogin navigate={navigate} />;
        if (!user) return <p className="muted">Memuat akses seller...</p>;
        if (roleName(user) !== 'seller') {
            return (
                <div className="panel empty-state">
                    <h1>Akses ditolak</h1>
                    <p className="muted">Halaman seller hanya bisa dibuka oleh akun seller.</p>
                </div>
            );
        }

        if (route.view === 'seller-dashboard') return <SellerDashboard {...context} />;
        if (route.view === 'seller-profile') return <SellerProfile {...context} />;
        if (route.view === 'seller-products') return <SellerProducts {...context} />;
        if (route.view === 'seller-orders') return <SellerOrders {...context} />;
        if (route.view === 'seller-reviews') return <SellerReviews {...context} />;

        return <SellerDashboard {...context} />;
    }

    function renderAdminPage() {
        if (!token) return <NeedLogin navigate={navigate} />;
        if (!user) return <p className="muted">Memuat akses admin...</p>;
        if (roleName(user) !== 'admin') {
            return (
                <div className="panel empty-state">
                    <h1>Akses ditolak</h1>
                    <p className="muted">Halaman admin hanya bisa dibuka oleh akun admin.</p>
                </div>
            );
        }

        if (route.view === 'admin-dashboard') return <AdminDashboardPage {...context} />;
        if (route.view === 'admin-users') return <AdminUsersPage {...context} />;
        if (route.view === 'admin-sellers') return <AdminSellersPage {...context} />;
        if (route.view === 'admin-categories') return <AdminCategoriesPage {...context} />;
        if (route.view === 'admin-products') return <AdminProductsPage {...context} />;
        if (route.view === 'admin-orders') return <AdminOrdersPage {...context} />;
        if (route.view === 'admin-payments') return <AdminPaymentsPage {...context} />;
        if (route.view === 'admin-reports') return <AdminReportsPage {...context} />;
        if (route.view === 'admin-affiliates') return <AdminAffiliatesPage {...context} />;
        if (route.view === 'admin-affiliate-commissions') return <AdminAffiliateCommissionsPage {...context} />;
        if (route.view === 'admin-content') return <AdminContentPage {...context} />;

        return <AdminDashboardPage {...context} />;
    }

    return (
        <div className={`app-shell ${isSellerRoute ? 'seller-app-shell' : isAdminRoute ? 'admin-app-shell' : ''}`}>
            {isSellerRoute ? (
                <SellerLayout
                    current={route.view}
                    navigate={navigate}
                    user={user}
                    logout={logout}
                    sellerNotifications={sellerNotifications}
                    notice={notice}
                >
                    {renderSellerPage()}
                </SellerLayout>
            ) : isAdminRoute ? (
                renderAdminPage()
            ) : (
                <>
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
                </>
            )}
        </div>
    );
}
