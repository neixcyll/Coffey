import React from 'react';
import { CartIcon } from '../common/Header.jsx';

export default function CartEmptyState({ title, message, actionLabel, onAction }) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 my-auto">
            <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-[var(--color-soft,#f8f8f8)] text-[var(--color-muted,#777)] mb-4">
                <CartIcon />
            </div>
            <h3 className="text-[var(--color-text,#111)] text-lg font-semibold mb-2">{title}</h3>
            <p className="text-[0.9rem] text-[var(--color-muted,#777)] leading-relaxed mb-6 max-w-[240px]">
                {message}
            </p>
            <button 
                type="button" 
                onClick={onAction}
                className="w-full max-w-[200px] h-12 rounded-full font-semibold text-white bg-[var(--color-text,#111)] hover:bg-[#333] transition-colors cursor-pointer border-0"
            >
                {actionLabel}
            </button>
        </div>
    );
}
