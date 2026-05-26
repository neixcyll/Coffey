export default function NeedCustomerAccount({ logout }) {
    return (
        <div className="panel empty-state">
            <h1>Akun customer diperlukan</h1>
            <p className="muted">Affiliate hanya tersedia untuk akun customer. Logout lalu masuk dengan akun customer untuk membuka dashboard affiliate.</p>
            <button className="btn primary" onClick={() => logout()}>Logout</button>
        </div>
    );
}
