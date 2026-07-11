import React from 'react';
import ProductImage from '../product/ProductImage.jsx';
import CartQuantitySelector from './CartQuantitySelector.jsx';
import { formatPrice } from '../../utils/format.js';

export default function CartItemCard({ item, busy, onQuantityChange, onRemove, onProductClick }) {
    const stock = Number(item.variant?.stock || 0);
    const quantity = Number(item.quantity || 1);
    const productId = item.product?.slug || item.product?.id;
    const itemPrice = item.variant?.price ?? item.product?.price ?? (item.subtotal / quantity);
    
    let variantText = '';
    if (item.variant) {
        let weight = item.variant.weight_grams;
        if (weight >= 1000 && weight % 1000 === 0) {
            weight = `${weight / 1000} kg`;
        } else {
            weight = `${weight} g`;
        }
        variantText = `${weight} • ${item.variant.grind_size}`;
    }

    return (
        <article className="flex gap-4 p-4 border-b border-[var(--color-border,#f0f0f0)] bg-transparent">
            <button 
                type="button" 
                onClick={() => productId && onProductClick('product', productId)}
                className="shrink-0 w-24 h-24 flex items-center justify-center rounded-xl bg-[var(--color-soft,#f8f8f8)] overflow-hidden cursor-pointer border border-[var(--color-border,#f0f0f0)] p-1"
            >
                <ProductImage product={item.product} small />
            </button>

            <div className="flex flex-col flex-1 min-w-0 justify-between py-1">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col flex-1 min-w-0">
                        <button 
                            type="button" 
                            onClick={() => productId && onProductClick('product', productId)}
                            className="text-[var(--color-text,#111)] text-[0.95rem] font-semibold text-left leading-snug line-clamp-2 bg-transparent border-0 p-0 cursor-pointer hover:underline"
                        >
                            {item.product?.name}
                        </button>
                        {variantText && (
                            <span className="text-[0.8rem] text-[var(--color-muted,#777)] mt-1 truncate">
                                {variantText}
                            </span>
                        )}
                    </div>
                    <strong className="text-[var(--color-text,#111)] text-[0.95rem] font-bold shrink-0">
                        {formatPrice(itemPrice)}
                    </strong>
                </div>

                <div className="flex justify-between items-center mt-3">
                    <CartQuantitySelector 
                        quantity={quantity} 
                        stock={stock} 
                        busy={busy} 
                        onChange={(val) => onQuantityChange(item, val)} 
                    />
                    
                    <button 
                        type="button" 
                        disabled={busy} 
                        onClick={() => onRemove(item)}
                        className="flex items-center gap-1.5 text-[var(--color-muted,#999)] hover:text-[#dc2626] disabled:opacity-50 transition-colors bg-transparent border-0 p-1 text-[0.8rem] font-medium cursor-pointer"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        Remove
                    </button>
                </div>
            </div>
        </article>
    );
}
