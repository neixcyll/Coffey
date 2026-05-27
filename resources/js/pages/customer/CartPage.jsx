import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import ProductImage from '../../components/product/ProductImage.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, formatWeight } from '../../utils/format.js';

export default function CartPage({ token, navigate, setNotice, refreshCartCount }) {
    const [cart, setCart] = useState(null);

    useEffect(() => {
        if (!token) return;
        loadCart();
    }, [token]);

    async function loadCart() {
        try {
            const data = await apiRequest('/cart', { token });
            setCart(data.data);
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function updateItem(item, quantity) {
        try {
            await apiRequest(`/cart/items/${item.id}`, { method: 'PUT', token, body: { quantity: Number(quantity) } });
            loadCart();
            refreshCartCount?.();
        } catch (error) {
            setNotice(error.message);
        }
    }

    async function removeItem(item) {
        await apiRequest(`/cart/items/${item.id}`, { method: 'DELETE', token }).catch((error) => setNotice(error.message));
        loadCart();
        refreshCartCount?.();
    }

    if (!token) return <NeedLogin navigate={navigate} />;
    if (!cart) return <p className="muted">Memuat cart...</p>;

    return (
        <section>
            <div className="section-head">
                <div>
                    <p className="eyebrow">Cart</p>
                    <h1>Item belanja</h1>
                </div>
                <strong>{formatPrice(cart.total_amount)}</strong>
            </div>
            <div className="stack">
                {cart.items.map((item) => (
                    <div className="line-item" key={item.id}>
                        <ProductImage product={item.product} small />
                        <div>
                            <strong>{item.product.name}</strong>
                            <p className="muted">
                                {formatPrice(item.variant?.price)} - {variantLabel(item.variant)} - stock {item.variant?.stock ?? 0}
                            </p>
                        </div>
                        <input className="qty" type="number" min="1" value={item.quantity} onChange={(event) => updateItem(item, event.target.value)} />
                        <strong>{formatPrice(item.subtotal)}</strong>
                        <button className="btn ghost" onClick={() => removeItem(item)}>Hapus</button>
                    </div>
                ))}
                {cart.items.length === 0 && <p className="muted">Cart kosong.</p>}
            </div>
            <button className="btn primary checkout-btn" disabled={cart.items.length === 0} onClick={() => navigate('checkout')}>Checkout</button>
        </section>
    );
}

function variantLabel(variant) {
    if (!variant) return 'Variant tidak tersedia';

    return `${formatWeight(variant.weight_grams)} / ${variant.grind_size}`;
}
