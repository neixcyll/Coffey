import React from 'react';

export default function CartQuantitySelector({ quantity, stock, busy, onChange }) {
    return (
        <div className="flex items-center border border-[var(--color-border,#e5e5e5)] rounded-full h-8 bg-[var(--color-surface,#fff)] shrink-0">
            <button 
                type="button" 
                disabled={busy || quantity <= 1} 
                onClick={() => onChange(quantity - 1)}
                className="w-8 h-full flex items-center justify-center text-[var(--color-text,#111)] hover:bg-[var(--color-soft,#f8f8f8)] disabled:opacity-30 transition-colors border-0 text-lg leading-none rounded-l-full cursor-pointer"
            >
                −
            </button>
            <span className="w-8 h-full flex items-center justify-center text-[0.85rem] font-semibold text-[var(--color-text,#111)] border-x border-[var(--color-border,#e5e5e5)] bg-transparent">
                {quantity}
            </span>
            <button 
                type="button" 
                disabled={busy || quantity >= stock} 
                onClick={() => onChange(quantity + 1)}
                className="w-8 h-full flex items-center justify-center text-[var(--color-text,#111)] hover:bg-[var(--color-soft,#f8f8f8)] disabled:opacity-30 transition-colors border-0 text-lg leading-none rounded-r-full cursor-pointer"
            >
                +
            </button>
        </div>
    );
}
