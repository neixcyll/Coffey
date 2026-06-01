import { useEffect, useMemo, useState } from 'react';
import { CartIcon } from '../common/Header.jsx';
import ProductImage from '../product/ProductImage.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, formatWeight } from '../../utils/format.js';
import { roleName } from '../../utils/route.js';

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
        <div className={`cart-drawer-shell ${open ? 'open' : ''}`} aria-hidden={!open}>
            {open && <button className="cart-drawer-backdrop" type="button" aria-label="Tutup cart" onClick={onClose} />}
            <aside className="cart-drawer" aria-label="Shopping cart" aria-modal="true" role="dialog">
                <header className="cart-drawer-header">
                    <div>
                        <p className="eyebrow">Cart</p>
                        <h2>Keranjang</h2>
                    </div>
                    <button className="icon-button" type="button" aria-label="Tutup cart" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </header>

                {!token ? (
                    <CartPrompt
                        title="Login untuk melihat cart"
                        message="Simpan produk favorit dan checkout lebih cepat dengan akun customer."
                        actionLabel="Login"
                        onAction={() => go('login')}
                    />
                ) : !isCustomer ? (
                    <CartPrompt
                        title="Cart tersedia untuk customer"
                        message="Gunakan akun customer untuk membeli produk dari marketplace."
                        actionLabel="Kembali ke Home"
                        onAction={() => go('products')}
                    />
                ) : !cart ? (
                    <div className="cart-drawer-loading">
                        <span />
                        <span />
                        <span />
                    </div>
                ) : items.length === 0 ? (
                    <CartPrompt
                        title="Cart masih kosong"
                        message="Pilih beans, grind size, dan ukuran yang cocok untuk seduhanmu."
                        actionLabel="Explore products"
                        onAction={() => go('blog')}
                    />
                ) : (
                    <>
                        <div className="cart-drawer-list">
                            {items.map((item) => (
                                <DrawerLineItem
                                    key={item.id}
                                    item={item}
                                    busy={busyItem === item.id}
                                    onQuantityChange={updateItem}
                                    onRemove={removeItem}
                                    onProductClick={go}
                                />
                            ))}
                        </div>

                        <footer className="cart-drawer-footer">
                            <div className="summary-rows">
                                <div>
                                    <span>Subtotal</span>
                                    <strong>{formatPrice(cart.total_amount)}</strong>
                                </div>
                                <div>
                                    <span>Items</span>
                                    <strong>{totalItems}</strong>
                                </div>
                            </div>
                            <button className="btn primary wide" type="button" onClick={() => go('checkout')}>
                                Checkout
                            </button>
                        </footer>
                    </>
                )}
            </aside>
        </div>
    );
}

function DrawerLineItem({ item, busy, onQuantityChange, onRemove, onProductClick }) {
    const stock = Number(item.variant?.stock || 0);
    const quantity = Number(item.quantity || 1);
    const productId = item.product?.slug || item.product?.id;

    return (
        <article className="cart-drawer-item">
            <button className="cart-drawer-media" type="button" onClick={() => productId && onProductClick('product', productId)}>
                <ProductImage product={item.product} small />
            </button>
            <div className="cart-drawer-item-copy">
                <button className="cart-drawer-title" type="button" onClick={() => productId && onProductClick('product', productId)}>
                    {item.product?.name}
                </button>
                <span className="muted">{variantLabel(item.variant)}</span>
                <strong>{formatPrice(item.subtotal)}</strong>
                <div className="cart-drawer-controls">
                    <button type="button" disabled={busy || quantity <= 1} onClick={() => onQuantityChange(item, quantity - 1)}>
                        -
                    </button>
                    <input
                        type="number"
                        min="1"
                        max={stock || undefined}
                        value={quantity}
                        disabled={busy}
                        onChange={(event) => onQuantityChange(item, event.target.value)}
                        aria-label={`Quantity ${item.product?.name}`}
                    />
                    <button type="button" disabled={busy || quantity >= stock} onClick={() => onQuantityChange(item, quantity + 1)}>
                        +
                    </button>
                    <button className="cart-drawer-remove" type="button" disabled={busy} onClick={() => onRemove(item)}>
                        Remove
                    </button>
                </div>
            </div>
        </article>
    );
}

function CartPrompt({ title, message, actionLabel, onAction }) {
    return (
        <div className="cart-drawer-empty">
            <span className="cart-empty-icon">
                <CartIcon />
            </span>
            <div>
                <h3>{title}</h3>
                <p className="muted">{message}</p>
            </div>
            <button className="btn primary wide" type="button" onClick={onAction}>
                {actionLabel}
            </button>
        </div>
    );
}

function variantLabel(variant) {
    if (!variant) return 'Variant tidak tersedia';

    return `${formatWeight(variant.weight_grams)} / ${variant.grind_size}`;
}

function CloseIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
        </svg>
    );
}
