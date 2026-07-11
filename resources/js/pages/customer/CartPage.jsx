import { useEffect, useMemo, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import { CartIcon } from '../../components/common/Header.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, formatWeight } from '../../utils/format.js';

export default function CartPage({ token, navigate, setNotice, refreshCartCount }) {
    const [cart, setCart] = useState(null);
    const [busyItem, setBusyItem] = useState(null);

    useEffect(() => {
        if (!token) return;
        loadCart();
    }, [token]);

    const items = cart?.items || [];
    const totalItems = useMemo(() => items.reduce((total, item) => total + Number(item.quantity || 0), 0), [items]);

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
            await apiRequest(`/cart/items/${item.id}`, { method: 'PUT', token, body: { quantity: nextQuantity } });
            loadCart();
            refreshCartCount?.();
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
            loadCart();
            refreshCartCount?.();
        } catch (error) {
            setNotice(error.message);
        } finally {
            setBusyItem(null);
        }
    }

    if (!token) return <NeedLogin navigate={navigate} />;
    if (!cart) return <CartSkeleton />;

    return (
        <section className="cart-page">
            <header className="cart-hero">
                <div>
                    <p className="eyebrow">Cart</p>
                    <h1>Cart belanja</h1>
                    <p>Review pilihan beans dan brewing gear kamu sebelum checkout.</p>
                </div>
                <div className="cart-total-card">
                    <span>Total belanja</span>
                    <strong>{formatPrice(cart.total_amount)}</strong>
                    <small>{totalItems} item di cart</small>
                </div>
            </header>

            {items.length === 0 ? (
                <CartEmptyState navigate={navigate} />
            ) : (
                <div className="cart-layout">
                    <div className="cart-items-panel">
                        <div className="cart-list-head">
                            <div>
                                <p className="eyebrow">Items</p>
                                <h2>Products siap checkout</h2>
                            </div>
                            <span>{totalItems} item</span>
                        </div>

                        <div className="cart-item-list">
                            {items.map((item) => (
                                <CartLineItem
                                    key={item.id}
                                    item={item}
                                    busy={busyItem === item.id}
                                    onQuantityChange={updateItem}
                                    onRemove={removeItem}
                                    navigate={navigate}
                                />
                            ))}
                        </div>
                    </div>

                    <aside className="cart-summary-card">
                        <div>
                            <p className="eyebrow">Summary</p>
                            <h2>Ringkasan order</h2>
                        </div>
                        <div className="summary-rows">
                            <div>
                                <span>Subtotal produk</span>
                                <strong>{formatPrice(cart.total_amount)}</strong>
                            </div>
                            <div>
                                <span>Total item</span>
                                <strong>{totalItems}</strong>
                            </div>
                            <div className="summary-total">
                                <span>Total checkout</span>
                                <strong>{formatPrice(cart.total_amount)}</strong>
                            </div>
                        </div>
                        <button className="btn primary checkout-btn" type="button" onClick={() => navigate('checkout')}>
                            Checkout
                        </button>
                        <button className="btn ghost checkout-btn" type="button" onClick={() => navigate('products')}>
                            Lanjut belanja
                        </button>
                        <p className="cart-summary-note">Ongkir dan metode pembayaran dihitung di halaman checkout.</p>
                    </aside>
                </div>
            )}
        </section>
    );
}

function CartLineItem({ item, busy, onQuantityChange, onRemove, navigate }) {
    const stock = Number(item.variant?.stock || 0);
    const quantity = Number(item.quantity || 1);
    const productId = item.product?.slug || item.product?.id;

    return (
        <article className="cart-item-card">
            <button className="cart-item-media" type="button" onClick={() => productId && navigate('product', productId)}>
                <ProductImage product={item.product} small />
            </button>
            <div className="cart-item-info">
                <div className="market-product-topline">
                    <span className="tag">{item.product?.category?.name || 'Coffee'}</span>
                    {item.product?.seller?.status === 'active' && <span className="badge verified">Verified Seller</span>}
                </div>
                <button className="cart-item-title" type="button" onClick={() => productId && navigate('product', productId)}>
                    {item.product?.name}
                </button>
                <p className="muted">{item.product?.seller?.store_name || 'Seller kopi'}</p>
                <div className="cart-variant-row">
                    <span>{variantLabel(item.variant)}</span>
                    <span>Stock {stock}</span>
                    <span>{formatPrice(item.variant?.price)}</span>
                </div>
            </div>

            <div className="cart-quantity-control" aria-label="Ubah quantity">
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
            </div>

            <div className="cart-item-subtotal">
                <span>Subtotal</span>
                <strong>{formatPrice(item.subtotal)}</strong>
            </div>

            <button className="cart-remove-button" type="button" disabled={busy} onClick={() => onRemove(item)}>
                Delete
            </button>
        </article>
    );
}

function CartEmptyState({ navigate }) {
    return (
        <div className="cart-empty-state">
            <span className="cart-empty-icon">
                <CartIcon />
            </span>
            <div>
                <p className="eyebrow">Cart kosong</p>
                <h2>Belum ada produk di keranjang</h2>
                <p className="muted">Temukan beans lokal, brewing gear, dan rekomendasi kopi dari seller terpercaya.</p>
            </div>
            <button className="btn primary" type="button" onClick={() => navigate('products')}>
                Belanja produk kopi
            </button>
        </div>
    );
}

function CartSkeleton() {
    return (
        <section className="cart-page">
            <div className="cart-hero skeleton-card">
                <span />
                <strong />
                <p />
            </div>
            <div className="cart-layout">
                <div className="cart-items-panel skeleton-card">
                    <p />
                    <p />
                    <p />
                </div>
                <aside className="cart-summary-card skeleton-card">
                    <p />
                    <p />
                    <strong />
                </aside>
            </div>
        </section>
    );
}

function variantLabel(variant) {
    if (!variant) return 'Variant tidak tersedia';

    return `${formatWeight(variant.weight_grams)} / ${variant.grind_size}`;
}
