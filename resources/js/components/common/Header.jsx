import { useState } from 'react';
import { formatPrice } from '../../utils/format.js';
import { roleName } from '../../utils/route.js';

export default function Header({ user, navigate, logout, currentView, cartCount, sellerNotifications }) {
    const role = roleName(user);
    const [showNotifications, setShowNotifications] = useState(false);
    const itemClass = (view) => (currentView === view ? 'nav-item active border border-[#d7c4b4] bg-[#fffaf2] font-bold px-3.5 py-2 rounded-lg text-[#38291e]' : 'nav-item text-[#38291e] font-bold hover:border hover:border-[#d7c4b4] hover:bg-[#fffaf2] px-3.5 py-2 rounded-lg transition-all border border-transparent');
    const notificationOrders = sellerNotifications?.orders || [];

    return (
        <header className="topbar sticky top-0 z-10 grid grid-cols-1 md:grid-cols-[200px_1fr_200px] gap-4 items-center px-7 py-3.5 border-b border-[#e4d7c8] bg-[rgba(255,252,247,0.92)] backdrop-blur-md">
            <button className="brand inline-flex items-center gap-2.5 text-left bg-transparent border-0 cursor-pointer" onClick={() => navigate('products')}>
                <img className="brand-mark w-[38px] h-[38px] object-contain" src="/logo.png" alt="Marketplace Kopi Logo" style={{ background: 'transparent' }} />
                <span>
                    <strong className="block text-[#38291e] font-extrabold leading-tight">Marketplace Kopi</strong>
                    <small className="block text-[#75695d] text-xs">Core ecommerce</small>
                </span>
            </button>

            <nav className="nav flex flex-wrap gap-1.5 items-center justify-center">
                <button className={itemClass('products')} onClick={() => navigate('products')}>Products</button>
                <button className={itemClass('blog')} onClick={() => navigate('blog')}>Blog</button>
                <button className={itemClass('review')} onClick={() => navigate('review')}>Review</button>
                <button className={itemClass('brewing-guide')} onClick={() => navigate('brewing-guide')}>Guide</button>
                {role === 'customer' && (
                    <>
                        <button className={itemClass('orders')} onClick={() => navigate('orders')}>Order</button>
                        <button className={itemClass('account-settings')} onClick={() => navigate('account-settings')}>Akun</button>
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
                        <button className={itemClass('seller-products')} onClick={() => navigate('seller-products')}>Products Saya</button>
                        <button className={itemClass('seller-orders')} onClick={() => navigate('seller-orders')}>Order Masuk</button>
                        <button className={itemClass('seller-reviews')} onClick={() => navigate('seller-reviews')}>Ulasan Products</button>
                    </>
                )}
                {role === 'admin' && (
                    <button className={itemClass('admin-dashboard')} onClick={() => navigate('admin-dashboard')}>Admin</button>
                )}
            </nav>

            <div className="account flex flex-wrap gap-3 items-center justify-end text-sm text-[#38291e]">
                {user ? (
                    <>
                        {role === 'seller' && (
                            <div className="notification-wrap relative inline-flex items-center justify-center">
                                <button
                                    className={`${itemClass('seller-orders')} notification-button cursor-pointer`}
                                    title="Notifikasi order masuk"
                                    aria-label="Notifikasi order masuk"
                                    onClick={() => setShowNotifications((current) => !current)}
                                >
                                    <BellIcon />
                                    {Number(sellerNotifications?.count || 0) > 0 && <span className="cart-badge">{sellerNotifications.count}</span>}
                                </button>
                                {showNotifications && (
                                    <div className="notification-popover absolute top-[calc(100%+10px)] right-0 z-30 grid w-[min(360px,calc(100vw-32px))] gap-3 border border-[#eadfd4] rounded-lg p-3.5 bg-[#ffffff] shadow-[0_24px_70px_rgba(17,17,17,0.12)]">
                                        <div className="row between flex justify-between items-center gap-2 pb-2 border-b border-gray-100">
                                            <strong className="text-gray-900 font-bold">Order masuk</strong>
                                            <button className="btn ghost compact-btn" onClick={() => { setShowNotifications(false); navigate('seller-orders'); }}>Lihat semua</button>
                                        </div>
                                        <div className="notification-list grid gap-2 max-h-[320px] overflow-y-auto">
                                            {notificationOrders.map((order) => (
                                                <button
                                                    key={order.id}
                                                    className="notification-item flex flex-col gap-1 w-full text-left p-2.5 border-b border-gray-50 rounded-lg hover:bg-gray-50 transition-colors bg-transparent"
                                                    onClick={() => { setShowNotifications(false); navigate('seller-orders'); }}
                                                >
                                                    <span className="flex flex-col gap-0.5">
                                                        <strong className="text-gray-900 font-bold">{order.order_number}</strong>
                                                        <small className="text-gray-600 text-xs">{order.customer_name} - {formatPrice(order.seller_total)}</small>
                                                    </span>
                                                    <small className="text-gray-400 text-[0.72rem] mt-0.5">{new Date(order.created_at).toLocaleString('id-ID')}</small>
                                                </button>
                                            ))}
                                            {notificationOrders.length === 0 && <p className="muted text-gray-500 text-sm text-center py-4">Belum ada order baru yang perlu diproses.</p>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {role === 'customer' && (
                            <button className={`${itemClass('cart')} cart-header-button cursor-pointer`} title="Cart" aria-label={`Cart ${cartCount || 0} item`} onClick={() => navigate('cart')}>
                                <CartIcon />
                                <span className="cart-button-label">Cart</span>
                                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                            </button>
                        )}
                        <span className="font-semibold text-gray-700">{user.name}</span>
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
        <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 4h2l2.2 10.5a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6.1" />
            <path d="M9 20h.01" />
            <path d="M18 20h.01" />
            <path d="M9.5 11h7" />
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
