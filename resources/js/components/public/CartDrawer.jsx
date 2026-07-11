import { useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../../services/api.js';
import { roleName } from '../../utils/route.js';

import CartHeader from './CartHeader.jsx';
import CartEmptyState from './CartEmptyState.jsx';
import CartItemCard from './CartItemCard.jsx';
import CartSummary from './CartSummary.jsx';

export default function CartDrawer({
    open,
    onClose,
    token,
    user,
    navigate,
    setNotice,
    refreshCartCount,
}) {
    const [cart, setCart] = useState(null);
    const [busyItem, setBusyItem] = useState(null);
    const role = roleName(user);
    const isCustomer = role === 'customer';

    useEffect(() => {
        if (!open || !token || !isCustomer) return;
        loadCart();
    }, [open, token, isCustomer]);

    const items = cart?.items || [];
    const totalItems = useMemo(
        () => items.reduce((total, item) => total + Number(item.quantity || 0), 0),
        [items],
    );

    async function loadCart() {
        try {
            const data = await apiRequest('/cart', { token });
            setCart(data.data);
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function updateItem(item, quantity) {
        const stock = Number(item.variant?.stock || 1);
        const nextQuantity = Math.max(1, Math.min(Number(quantity) || 1, stock));

        if (nextQuantity === Number(item.quantity)) return;

        try {
            setBusyItem(item.id);
            await apiRequest(`/cart/items/${item.id}`, {
                method: 'PUT',
                token,
                body: { quantity: nextQuantity },
            });
            await loadCart();
            await refreshCartCount?.();
        } catch (error) {
            setNotice(error.message);
        } finally {
            setBusyItem(null);
        }
    }

    async function removeItem(item) {
        try {
            setBusyItem(item.id);
            await apiRequest(`/cart/items/${item.id}`, { method: 'DELETE', token });
            await loadCart();
            await refreshCartCount?.();
        } catch (error) {
            setNotice(error.message);
        } finally {
            setBusyItem(null);
        }
    }

    function go(view, id) {
        onClose();
        navigate(view, id);
    }

    return (
        <div className={`fixed inset-0 z-[120] ${open ? 'pointer-events-auto' : 'pointer-events-none opacity-0'} transition-opacity duration-300`} aria-hidden={!open}>
            {/* Backdrop */}
            {open && (
                <button 
                    type="button" 
                    aria-label="Tutup cart" 
                    onClick={onClose}
                    className="fixed inset-0 bg-[rgba(0,0,0,0.4)] backdrop-blur-sm border-0 w-full h-full cursor-default" 
                />
            )}
            
            {/* Drawer */}
            <aside 
                role="dialog"
                aria-modal="true"
                aria-label="Shopping cart"
                className={`fixed top-0 right-0 h-full w-full max-w-[420px] z-[130] bg-[var(--color-surface,#fff)] border-l border-[var(--color-border,#e5e5e5)] shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <CartHeader onClose={onClose} totalItems={totalItems} />

                <div className="flex-1 overflow-y-auto flex flex-col bg-transparent">
                    {!token ? (
                        <CartEmptyState
                            title="Login untuk melihat cart"
                            message="Save produk favorit dan checkout lebih cepat dengan akun customer."
                            actionLabel="Login"
                            onAction={() => go('login')}
                        />
                    ) : !isCustomer ? (
                        <CartEmptyState
                            title="Cart tersedia untuk customer"
                            message="Gunakan akun customer untuk membeli produk dari marketplace."
                            actionLabel="Kembali ke Home"
                            onAction={() => go('products')}
                        />
                    ) : !cart ? (
                        <div className="p-6 flex flex-col gap-4">
                            <span className="h-28 bg-[var(--color-soft,#f8f8f8)] animate-pulse rounded-xl" />
                            <span className="h-28 bg-[var(--color-soft,#f8f8f8)] animate-pulse rounded-xl" />
                            <span className="h-28 bg-[var(--color-soft,#f8f8f8)] animate-pulse rounded-xl" />
                        </div>
                    ) : items.length === 0 ? (
                        <CartEmptyState
                            title="Your cart is empty"
                            message="Select the perfect beans, grind size, and weight for your next brew."
                            actionLabel="Explore products"
                            onAction={() => go('blog')}
                        />
                    ) : (
                        <div className="flex flex-col">
                            {items.map((item) => (
                                <CartItemCard
                                    key={item.id}
                                    item={item}
                                    busy={busyItem === item.id}
                                    onQuantityChange={updateItem}
                                    onRemove={removeItem}
                                    onProductClick={go}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {token && isCustomer && cart && items.length > 0 && (
                    <CartSummary 
                        cart={cart} 
                        totalItems={totalItems} 
                        onCheckout={() => go('checkout')} 
                    />
                )}
            </aside>
        </div>
    );
}
