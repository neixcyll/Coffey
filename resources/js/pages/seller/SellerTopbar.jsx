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
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/95 backdrop-blur-md border-b border-gray-200">
            <div className="flex items-center gap-4">
                <button 
                    className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-black transition-colors" 
                    type="button" 
                    onClick={onMenuClick} 
                    aria-label="Buka menu seller"
                >
                    <MenuIcon />
                </button>

                <div className="hidden md:flex flex-col">
                    <strong className="text-gray-900 font-bold text-lg tracking-tight leading-tight">Halo, {user?.name || 'Seller'} 👋</strong>
                    <small className="text-gray-500 font-medium tracking-wide">Pantau kinerja {storeName || 'toko Anda'} hari ini</small>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative">
                    <button
                        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-black transition-colors relative"
                        type="button"
                        title="Notifikasi order masuk"
                        aria-label="Notifikasi order masuk"
                        onClick={() => setShowNotifications((current) => !current)}
                    >
                        <BellIcon />
                        {notificationCount > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white flex items-center justify-center rounded-full text-[10px] font-bold border-2 border-white -mt-1 -mr-1">
                                {notificationCount}
                            </span>
                        )}
                    </button>
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden origin-top-right">
                            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <strong className="text-sm text-gray-900">Order Masuk</strong>
                                <button className="text-xs font-semibold text-black hover:underline bg-transparent border-0 cursor-pointer" type="button" onClick={openOrders}>
                                    Lihat Semua
                                </button>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notificationOrders.map((order) => (
                                    <button 
                                        key={order.id} 
                                        className="w-full text-left p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 flex flex-col gap-1 transition-colors bg-white cursor-pointer" 
                                        type="button" 
                                        onClick={openOrders}
                                    >
                                        <div className="flex justify-between items-start w-full">
                                            <strong className="text-sm text-gray-900">{order.order_number}</strong>
                                            <small className="text-xs text-gray-400">{new Date(order.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small>
                                        </div>
                                        <span className="text-xs text-gray-600 truncate w-full">{order.customer_name} - {formatPrice(order.seller_total)}</span>
                                    </button>
                                ))}
                                {notificationOrders.length === 0 && (
                                    <div className="p-8 text-center">
                                        <p className="text-sm text-gray-500 font-medium">Belum ada order baru.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block" />

                <div className="relative group cursor-pointer hidden sm:block">
                    <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-gray-100">
                            {initials(user?.name)}
                        </span>
                    </div>
                    <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pt-1 z-50 origin-top-right">
                        <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Seller'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <div className="p-1">
                            <button 
                                className="w-full text-left px-3 py-2 text-sm text-red-600 font-medium rounded-lg hover:bg-red-50 bg-transparent border-0 cursor-pointer transition-colors" 
                                type="button" 
                                onClick={() => logout()}
                            >
                                Keluar
                            </button>
                        </div>
                    </div>
                </div>
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
