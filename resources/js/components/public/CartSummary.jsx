import React from 'react';
import { formatPrice } from '../../utils/format.js';

export default function CartSummary({ cart, totalItems, onCheckout }) {
    if (!cart) return null;
    
    return (
        <footer className="shrink-0 border-t border-[var(--color-border,#ebebeb)] p-6 bg-[var(--color-surface,#fff)]">
            <div className="flex flex-col gap-3 mb-6">
                <div className="flex justify-between items-center text-[0.9rem] text-[var(--color-muted,#666)]">
                    <span>Items</span>
                    <strong className="text-[var(--color-text,#111)] font-medium">{totalItems}</strong>
                </div>
                <div className="flex justify-between items-center text-[1rem]">
                    <span className="font-semibold text-[var(--color-text,#111)]">Subtotal</span>
                    <strong className="text-[var(--color-text,#111)] font-bold text-lg">
                        {formatPrice(cart.total_amount)}
                    </strong>
                </div>
            </div>
            <button 
                type="button" 
                onClick={onCheckout}
                className="w-full h-14 rounded-full font-bold text-lg text-white bg-[var(--color-text,#111)] shadow-[0_8px_16px_rgba(17,17,17,0.1)] hover:bg-[#333] hover:-translate-y-0.5 transition-all cursor-pointer border-0"
            >
                Checkout
            </button>
        </footer>
    );
}
