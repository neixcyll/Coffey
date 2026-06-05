import { useState } from 'react';
import { BellIcon } from './Header.jsx';

export default function UserNotificationMenu({
    notifications = [],
    unreadCount = 0,
    navigate,
    onMarkRead,
    onMarkAllRead,
    buttonClassName = 'cart-header-button notification-button',
}) {
    const [open, setOpen] = useState(false);

    async function openNotification(notification) {
        await onMarkRead?.(notification);
        setOpen(false);
        navigate('orders', notification.order_id || notification.order?.id);
    }

    async function markAll() {
        await onMarkAllRead?.();
        setOpen(false);
    }

    return (
        <div className="notification-wrap">
            <button
                className={buttonClassName}
                type="button"
                title="Notifikasi"
                aria-label={`Notifikasi ${unreadCount || 0} belum dibaca`}
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
            >
                <BellIcon />
                {unreadCount > 0 && <span className="cart-badge">{unreadCount}</span>}
            </button>

            {open && (
                <div className="notification-popover user-notification-popover">
                    <div className="row between notification-popover-head">
                        <strong>Notifikasi</strong>
                        {unreadCount > 0 && (
                            <button className="btn ghost compact-btn" type="button" onClick={markAll}>
                                Tandai semua
                            </button>
                        )}
                    </div>
                    <div className="notification-list">
                        {notifications.map((notification) => (
                            <button
                                className={`notification-item ${notification.is_read ? '' : 'unread'}`}
                                key={notification.id}
                                type="button"
                                onClick={() => openNotification(notification)}
                            >
                                <span className="notification-item-title">
                                    {!notification.is_read && <i aria-hidden="true" />}
                                    <strong>{notification.title}</strong>
                                </span>
                                <small>{notification.message}</small>
                                <small>{new Date(notification.created_at).toLocaleString('id-ID')}</small>
                            </button>
                        ))}
                        {notifications.length === 0 && <p className="muted notification-empty">Belum ada notifikasi order.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
