import { useState } from 'react';
import { formatPrice } from '../../utils/format.js';

export default function SellerTopbar({ user, storeName, sellerNotifications, navigate, logout, onMenuClick }) {
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationOrders = sellerNotifications?.orders || [];
    const notificationCount = Number(sellerNotifications?.count || 0);

    function openOrders() {
        setShowNotifications(false);
        navigate('seller-orders');
    }

    return (
        <header className="seller-topbar">
            <button className="seller-menu-button" type="button" onClick={onMenuClick} aria-label="Buka menu seller">
                <MenuIcon />
            </button>

            <div className="seller-topbar-title">
                <strong>{storeName || 'Seller Kopi'}</strong>
                <small>Kelola katalog, order, dan ulasan toko</small>
            </div>

            <div className="seller-topbar-actions">
                <div className="notification-wrap">
                    <button
                        className="seller-icon-button"
                        type="button"
                        title="Notifikasi order masuk"
                        aria-label="Notifikasi order masuk"
                        onClick={() => setShowNotifications((current) => !current)}
                    >
                        <BellIcon />
                        {notificationCount > 0 && <span className="cart-badge">{notificationCount}</span>}
                    </button>
                    {showNotifications && (
                        <div className="notification-popover seller-notification-popover">
                            <div className="row between">
                                <strong>Order masuk</strong>
                                <button className="btn ghost compact-btn" type="button" onClick={openOrders}>Lihat semua</button>
                            </div>
                            <div className="notification-list">
                                {notificationOrders.map((order) => (
                                    <button key={order.id} className="notification-item" type="button" onClick={openOrders}>
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

                <div className="seller-account-chip">
                    <span className="seller-account-avatar">{initials(storeName || user?.name)}</span>
                    <span>
                        <strong>{user?.name || 'Seller'}</strong>
                        <small>{storeName || 'Seller Kopi'}</small>
                    </span>
                </div>

                <button className="btn ghost seller-logout-button" type="button" onClick={() => logout()}>Logout</button>
            </div>
        </header>
    );
}

function initials(value) {
    return (value || 'Seller')
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

function BellIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    );
}
