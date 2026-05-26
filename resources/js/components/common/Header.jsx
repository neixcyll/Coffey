import { useState } from 'react';
import { formatPrice } from '../../utils/format.js';
import { roleName } from '../../utils/route.js';

export default function Header({ user, navigate, logout, currentView, cartCount, sellerNotifications }) {
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
                        <button className={itemClass('seller-reviews')} onClick={() => navigate('seller-reviews')}>Ulasan Produk</button>
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

export function CartIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L22 6H6" />
        </svg>
    );
}

export function BellIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    );
}
