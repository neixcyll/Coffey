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
        <div className={`cart-drawer-shell ${open ? 'open' : ''} fixed inset-0 z-[120] pointer-events-none`} aria-hidden={!open}>
            {open && <button className="cart-drawer-backdrop fixed inset-0 bg-[rgba(17,17,17,0.38)] backdrop-blur-[10px] pointer-events-auto border-0" type="button" aria-label="Tutup cart" onClick={onClose} />}
            <aside className="cart-drawer fixed top-0 right-0 h-full w-[min(520px,100%)] z-[130] bg-[#ffffff] border-l border-[#e7e7e7] shadow-[-34px_0_90px_rgba(17,17,17,0.16)] flex flex-col transition-transform duration-300" aria-label="Shopping cart" aria-modal="true" role="dialog">
                <header className="cart-drawer-header flex justify-between items-start border-b border-[#ebebeb] p-6 md:p-8 bg-transparent">
                    <div>
                        <p className="eyebrow text-xs font-black uppercase text-gray-500 tracking-wider mb-2">Cart</p>
                        <h2 className="text-gray-900 text-3xl font-extrabold tracking-tight leading-none">Keranjang</h2>
                    </div>
                    <button className="icon-button w-[54px] h-[54px] flex items-center justify-center border border-[#dedede] rounded-[14px] text-gray-900 bg-white shadow-[0_12px_28px_rgba(17,17,17,0.06)] hover:bg-[#111111] hover:text-white transition-all cursor-pointer" type="button" aria-label="Tutup cart" onClick={onClose}>
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
                    <div className="cart-drawer-loading p-6 flex flex-col gap-4">
                        <span className="h-[82px] border-radius-[22px] bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse rounded-2xl" />
                        <span className="h-[82px] border-radius-[22px] bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse rounded-2xl" />
                        <span className="h-[82px] border-radius-[22px] bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse rounded-2xl" />
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
                        <div className="cart-drawer-list flex-1 overflow-y-auto flex flex-col gap-3.5 p-5">
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

                        <footer className="cart-drawer-footer border-t border-[#ebebeb] p-5 bg-[#ffffff] grid gap-4">
                            <div className="summary-rows grid gap-2 text-sm text-[#75695d]">
                                <div className="flex justify-between items-center">
                                    <span>Subtotal</span>
                                    <strong className="text-gray-900 font-bold">{formatPrice(cart.total_amount)}</strong>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span>Items</span>
                                    <strong className="text-gray-900 font-bold">{totalItems}</strong>
                                </div>
                            </div>
                            <button className="btn primary wide w-full min-h-[56px] rounded-full font-bold text-white bg-[#111111] shadow-[0_20px_48px_rgba(17,17,17,0.14)] hover:bg-[#242424] hover:-translate-y-[1px] transition-all cursor-pointer" type="button" onClick={() => go('checkout')}>
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
        <article className="cart-drawer-item grid grid-cols-[104px_1fr] gap-3.5 border border-[#e8e8e8] rounded-[24px] p-3 text-gray-900 bg-white shadow-[0_14px_34px_rgba(17,17,17,0.06)]">
            <button className="cart-drawer-media w-[104px] h-[104px] flex items-center justify-center rounded-[18px] bg-[#f5f5f5] overflow-hidden cursor-pointer border-0 p-0" type="button" onClick={() => productId && onProductClick('product', productId)}>
                <ProductImage product={item.product} small />
            </button>
            <div className="cart-drawer-item-copy flex flex-col gap-1 text-left">
                <button className="cart-drawer-title text-[#111111] text-[1rem] font-bold text-left leading-snug bg-transparent border-0 p-0 cursor-pointer hover:underline" type="button" onClick={() => productId && onProductClick('product', productId)}>
                    {item.product?.name}
                </button>
                <span className="muted text-xs text-gray-500">{variantLabel(item.variant)}</span>
                <strong className="text-gray-900 text-[1.05rem] font-bold">{formatPrice(item.subtotal)}</strong>
                <div className="cart-drawer-controls grid grid-cols-[36px_52px_36px_auto] gap-1 items-center mt-2">
                    <button type="button" className="w-9 h-9 flex items-center justify-center border border-[#dedede] rounded-full text-gray-900 bg-white font-black hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer" disabled={busy || quantity <= 1} onClick={() => onQuantityChange(item, quantity - 1)}>
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
                        className="w-[52px] h-9 text-center border border-[#dedede] rounded-full text-gray-900 bg-white font-bold focus:outline-none focus:ring-1 focus:ring-[#111111]"
                    />
                    <button type="button" className="w-9 h-9 flex items-center justify-center border border-[#dedede] rounded-full text-gray-900 bg-white font-black hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer" disabled={busy || quantity >= stock} onClick={() => onQuantityChange(item, quantity + 1)}>
                        +
                    </button>
                    <button className="cart-drawer-remove border-0 bg-transparent text-[#b2472a] font-bold text-sm hover:underline cursor-pointer ml-auto" type="button" disabled={busy} onClick={() => onRemove(item)}>
                        Remove
                    </button>
                </div>
            </div>
        </article>
    );
}

function CartPrompt({ title, message, actionLabel, onAction }) {
    return (
        <div className="cart-drawer-empty relative grid justify-items-center text-center gap-5 border border-[#e8e8e8] rounded-[30px] p-6 md:p-8 m-5 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(247,247,247,0.94)),#f7f7f7] shadow-[0_24px_70px_rgba(17,17,17,0.08)] overflow-hidden">
            <span className="cart-empty-icon grid w-[72px] h-[72px] place-items-center border border-[rgba(255,255,255,0.16)] rounded-[20px] text-white bg-[#111111] shadow-[0_22px_44px_rgba(17,17,17,0.18)]">
                <CartIcon />
            </span>
            <div className="grid gap-1">
                <h3 className="text-gray-900 text-xl font-bold">{title}</h3>
                <p className="muted text-[#6b6b6b] text-[1.04rem] leading-relaxed">{message}</p>
            </div>
            <button className="btn primary wide w-full min-h-[56px] rounded-full font-bold text-white bg-[#111111] shadow-[0_20px_48px_rgba(17,17,17,0.14)] hover:bg-[#242424] hover:-translate-y-[1px] transition-all cursor-pointer" type="button" onClick={onAction}>
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
