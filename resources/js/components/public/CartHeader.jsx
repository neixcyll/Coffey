import React from 'react';

export default function CartHeader({ onClose, totalItems }) {
    return (
        <header className="flex justify-between items-start border-b border-[var(--color-border,#ebebeb)] px-6 py-4 bg-transparent shrink-0">
            <div>
                <h2 className="text-[var(--color-text,#111)] text-2xl font-bold tracking-tight">
                    Cart 
                    
                </h2>
                <p className="text-[0.85rem] text-[var(--color-muted,#777)] mt-1">
                    Freshly selected coffee beans
                </p>
            </div>
            <button 
                type="button" 
                aria-label="Close cart" 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text,#111)] bg-[var(--color-soft,#f8f8f8)] hover:bg-[var(--color-border,#e5e5e5)] transition-colors cursor-pointer border-0"
            >
                <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18" />
                    <path d="M6 6l12 12" />
                </svg>
            </button>
        </header>
    );
}
