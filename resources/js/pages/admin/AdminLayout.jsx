export default function AdminLayout({ current, navigate, children }) {
    const items = [
        ['admin-dashboard', 'Dashboard'],
        ['admin-users', 'Users'],
        ['admin-sellers', 'Sellers'],
        ['admin-categories', 'Categories'],
        ['admin-products', 'Products'],
        ['admin-orders', 'Orders'],
        ['admin-payments', 'Payments'],
        ['admin-content', 'Content'],
        ['admin-affiliates', 'Affiliates'],
        ['admin-affiliate-commissions', 'Commissions'],
        ['admin-reports', 'Reports'],
    ];

    return (
        <section className="admin-layout">
            <aside className="admin-sidebar">
                <strong>Admin</strong>
                {items.map(([view, label]) => (
                    <button key={view} className={current === view ? 'active' : ''} onClick={() => navigate(view)}>{label}</button>
                ))}
            </aside>
            <div className="admin-content">{children}</div>
        </section>
    );
}
