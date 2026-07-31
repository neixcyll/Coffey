import { forwardRef, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Portal } from './Portal.jsx';
import { X } from 'lucide-react';

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    showClose = true,
    closeOnOverlayClick = true,
    className = '',
    ...props
}) {
    const [mounted, setMounted] = useState(false);
    const contentRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[90vw]',
    };

    return (
        <Portal>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={closeOnOverlayClick ? onClose : undefined}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? 'modal-title' : undefined}
                aria-describedby={description ? 'modal-description' : undefined}
            >
                <div
                    ref={contentRef}
                    className={clsx(
                        'w-full bg-card border border-border rounded-2xl shadow-2xl',
                        '',
                        sizes[size],
                        className
                    )}
                    onClick={(e) => e.stopPropagation()}
                    {...props}
                >
                    {(title || showClose) && (
                        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-border">
                            <div>
                                {title && (
                                    <h2 id="modal-title" className="text-lg font-bold text-foreground">
                                        {title}
                                    </h2>
                                )}
                                {description && (
                                    <p id="modal-description" className="text-sm text-muted-foreground mt-1">
                                        {description}
                                    </p>
                                )}
                            </div>
                            {showClose && (
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
                                    aria-label="Close modal"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    )}
                    <div className="px-6 py-4">{children}</div>
                </div>
            </div>
        </Portal>
    );
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Konfirmasi',
    message,
    confirmText = 'Ya, lanjutkan',
    cancelText = 'Batal',
    variant = 'destructive',
    loading = false,
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
        >
            <div className="space-y-4">
                <p className="text-foreground">{message}</p>
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-accent transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50
                            ${variant === 'destructive'
                                ? 'bg-rose-600 text-white hover:bg-rose-700'
                                : variant === 'success'
                                ? 'bg-sage-600 text-white hover:bg-sage-700'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Memproses...
                            </span>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export function FormModal({
    isOpen,
    onClose,
    onSubmit,
    title,
    description,
    children,
    size = 'md',
    submitText = 'Simpan',
    cancelText = 'Batal',
    loading = false,
}) {
    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
            size={size}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {children}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-semibold border border-border rounded-xl hover:bg-accent transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Menyimpan...' : submitText}
                    </button>
                </div>
            </form>
        </Modal>
    );
}