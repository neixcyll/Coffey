import { useEffect } from 'react';

export default function NotificationToast({ message, enabled = true, onDismiss, duration = 2800 }) {
    useEffect(() => {
        if (!enabled || !message) return undefined;

        const timer = window.setTimeout(() => onDismiss(message), duration);

        return () => window.clearTimeout(timer);
    }, [duration, enabled, message, onDismiss]);

    if (!enabled || !message) return null;

    const isError = toastType(message) === 'error';

    return (
        <div 
            className={`notification-toast fixed top-[78px] right-[18px] z-[180] grid grid-cols-[34px_minmax(0,1fr)_28px] gap-2.5 w-[min(380px,calc(100vw-28px))] items-start border rounded-xl p-3 text-white bg-[rgba(31,26,23,0.97)] shadow-[0_22px_60px_rgba(0,0,0,0.38)] backdrop-blur-md animate-[notification-toast-in_180ms_ease-out] ${
                isError ? 'border-[rgba(220,80,80,0.55)]' : 'border-[rgba(124,154,130,0.5)]'
            }`} 
            role="status" 
            aria-live="polite"
        >
            <span className={`notification-toast-icon grid w-[34px] h-[34px] place-items-center rounded-full ${
                isError ? 'text-[#ffc5c5] bg-[rgba(220,80,80,0.18)]' : 'text-[#d8eadb] bg-[rgba(124,154,130,0.18)]'
            }`}>
                {isError ? <XIcon /> : <CheckIcon />}
            </span>
            <div>
                <strong className="block mt-0.5 text-white text-[0.86rem] font-bold">{toastTitle(message)}</strong>
                <p className="margin-0 mt-1 text-gray-300 text-[0.78rem] leading-relaxed">{message}</p>
            </div>
            <button 
                type="button" 
                aria-label="Tutup notifikasi" 
                onClick={() => onDismiss(message)}
                className="grid w-7 h-7 place-items-center border-0 rounded bg-transparent text-gray-400 hover:text-white hover:bg-[rgba(233,215,195,0.08)] transition-all cursor-pointer"
            >
                <CloseIcon />
            </button>
        </div>
    );
}

function toastType(message) {
    return /(gagal|error|salah|wajib|ditolak|tidak|melebihi|kosong|lengkapi|periksa|blokir|banned|invalid|failed)/i.test(message) ? 'error' : 'success';
}

function toastTitle(message) {
    return toastType(message) === 'error' ? 'Perlu diperiksa' : 'Berhasil';
}

function CheckIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 12 4 4 8-8" />
        </svg>
    );
}

function XIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
        </svg>
    );
}
