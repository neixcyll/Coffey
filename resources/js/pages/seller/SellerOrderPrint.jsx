import { useEffect, useState } from 'react';
import NeedLogin from '../../components/common/NeedLogin.jsx';
import { apiRequest } from '../../services/api.js';
import { formatPrice, formatWeight } from '../../utils/format.js';

export default function SellerOrderPrint({ orderId, token, navigate, setNotice }) {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token || !orderId) return;

        setLoading(true);
        apiRequest(`/seller/orders/${orderId}`, { token })
            .then((response) => setOrder(response.data))
            .catch((error) => setNotice(error.message))
            .finally(() => setLoading(false));
    }, [orderId, token, setNotice]);

    if (!token) return <NeedLogin navigate={navigate} />;
    if (loading) return <p className="muted">Memuat label pengiriman...</p>;
    if (!order) return <p className="muted">Order tidak ditemukan.</p>;

    const productTotal = Number(order.seller_total || 0);
    const shippingCost = Number(order.shipping_cost || 0);

    return (
        <section className="shipping-print-page">
            <div className="shipping-print-actions">
                <button className="btn ghost" type="button" onClick={() => navigate('seller-orders')}>Kembali ke order</button>
                <button className="btn primary" type="button" onClick={() => window.print()}>Print label</button>
            </div>

            <article className="shipping-label-sheet">
                <header className="shipping-label-header">
                    <div>
                        <p>MARKETPLACE KOPI</p>
                        <h1>Label Pengiriman</h1>
                    </div>
                    <div className="shipping-label-order-number">
                        <small>Nomor order</small>
                        <strong>{order.order_number}</strong>
                    </div>
                </header>

                <section className="shipping-label-status-row">
                    <LabelValue label="Tanggal order" value={formatDate(order.created_at)} />
                    <LabelValue label="Status pembayaran" value={order.payment_status || 'pending'} />
                    <LabelValue label="Status order" value={order.status} />
                </section>

                <div className="shipping-label-address-grid">
                    <section>
                        <h2>Pengirim</h2>
                        <strong>{order.seller?.store_name || 'Seller Marketplace Kopi'}</strong>
                        <p>Kota asal: {order.origin_city || order.seller?.origin_city || '-'}</p>
                    </section>
                    <section>
                        <h2>Penerima</h2>
                        <strong>{order.customer_name}</strong>
                        <p>{order.customer_phone}</p>
                        <p>{order.shipping_address}</p>
                        <p><strong>Kota tujuan: {order.destination_city || '-'}</strong></p>
                    </section>
                </div>

                <section className="shipping-label-courier">
                    <LabelValue label="Kurir" value={order.courier || '-'} />
                    <LabelValue label="Layanan" value={order.shipping_service || '-'} />
                    <LabelValue label="Estimasi sampai" value={order.shipping_estimated_days || '-'} />
                    <LabelValue label="Ongkir" value={formatPrice(shippingCost)} />
                </section>

                <section className="shipping-label-products">
                    <h2>Daftar Products</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Products</th>
                                <th>Varian</th>
                                <th>Qty</th>
                                <th>Harga</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(order.items || []).map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <strong>{item.product_name}</strong>
                                        <small>{brewingMethods(item)}</small>
                                    </td>
                                    <td>{formatWeight(item.weight_grams)}<br />{item.grind_size || '-'}</td>
                                    <td>{item.quantity}</td>
                                    <td>{formatPrice(item.price)}</td>
                                    <td>{formatPrice(item.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className="shipping-label-footer">
                    <div>
                        <h2>Catatan pembeli</h2>
                        <p>{order.notes || 'Tidak ada catatan pembeli.'}</p>
                    </div>
                    <dl>
                        <div><dt>Total produk</dt><dd>{formatPrice(productTotal)}</dd></div>
                        <div><dt>Total ongkir</dt><dd>{formatPrice(shippingCost)}</dd></div>
                        <div><dt>Total pembayaran</dt><dd>{formatPrice(productTotal + shippingCost)}</dd></div>
                    </dl>
                </section>
            </article>
        </section>
    );
}

function LabelValue({ label, value }) {
    return <div><small>{label}</small><strong>{value}</strong></div>;
}

function formatDate(value) {
    return value ? new Date(value).toLocaleString('id-ID') : '-';
}

function brewingMethods(item) {
    const methods = item.product?.brewing_methods || [];
    return methods.length ? `Brewing: ${methods.map((method) => method.name).join(', ')}` : 'Brewing: -';
}
