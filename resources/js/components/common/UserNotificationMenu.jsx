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
        <div className="notification-wrap relative inline-flex items-center justify-center">
            <button
                className={`${buttonClassName} cursor-pointer`}
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
                <div className="notification-popover user-notification-popover absolute top-[calc(100%+10px)] right-0 z-30 grid w-[min(360px,calc(100vw-32px))] gap-3 border border-[#eadfd4] rounded-lg p-3.5 bg-[#ffffff] shadow-[0_24px_70px_rgba(17,17,17,0.12)]">
                    <div className="row between notification-popover-head flex justify-between items-center gap-2 pb-2 border-b border-gray-100">
                        <strong className="text-gray-900 font-bold">Notifikasi</strong>
                        {unreadCount > 0 && (
                            <button className="btn ghost compact-btn" type="button" onClick={markAll}>
                                Tandai semua
                            </button>
                        )}
                    </div>
                    <div className="notification-list grid gap-2 max-h-[320px] overflow-y-auto">
                        {notifications.map((notification) => (
                            <button
                                className={`notification-item flex flex-col gap-1 w-full text-left p-2.5 border-b border-gray-50 rounded-lg hover:bg-gray-50 transition-colors bg-transparent ${
                                    notification.is_read ? '' : 'unread border-l-4 border-l-[#2f6d56] bg-[rgba(124,154,130,0.06)]'
                                }`}
                                key={notification.id}
                                type="button"
                                onClick={() => openNotification(notification)}
                            >
                                <span className="notification-item-title flex items-center gap-1.5 font-bold text-gray-900">
                                    {!notification.is_read && <i aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#2f6d56]" />}
                                    <strong>{notification.title}</strong>
                                </span>
                                <small className="text-gray-600 text-xs leading-relaxed">{notification.message}</small>
                                <small className="text-gray-400 text-[0.72rem] mt-0.5">{new Date(notification.created_at).toLocaleString('id-ID')}</small>
                            </button>
                        ))}
                        {notifications.length === 0 && <p className="muted notification-empty text-gray-500 text-sm text-center py-4">Belum ada notifikasi order.</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
