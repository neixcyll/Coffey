import { useEffect } from 'react';

export default function NotificationToast({ message, enabled = true, onDismiss, duration = 2800 }) {
    useEffect(() => {
        if (!enabled || !message) return undefined;

        const timer = window.setTimeout(() => onDismiss(message), duration);

        return () => window.clearTimeout(timer);
    }, [duration, enabled, message, onDismiss]);

    if (!enabled || !message) return null;

    return (
        <div className={`notification-toast ${toastType(message)}`} role="status" aria-live="polite">
            <span className="notification-toast-icon">
                <CheckIcon />
            </span>
            <div>
                <strong>{toastTitle(message)}</strong>
                <p>{message}</p>
            </div>
            <button type="button" aria-label="Tutup notifikasi" onClick={() => onDismiss(message)}>
                <CloseIcon />
            </button>
        </div>
    );
}

function toastType(message) {
    return /(gagal|error|wajib|ditolak|tidak|melebihi|kosong|lengkapi|periksa)/i.test(message) ? 'error' : 'success';
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

function CloseIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12" />
            <path d="M18 6 6 18" />
        </svg>
    );
}
