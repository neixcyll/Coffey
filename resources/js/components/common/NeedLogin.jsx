import { rememberCurrentRoute } from '../../utils/route.js';

export default function NeedLogin({ navigate }) {
    function goLogin() {
        rememberCurrentRoute();
        navigate('login');
    }

    return (
        <div className="panel empty-state">
            <h1>Login diperlukan</h1>
            <p className="muted">Masuk dengan role yang sesuai untuk membuka halaman ini.</p>
            <button className="btn primary" onClick={goLogin}>Login</button>
        </div>
    );
}
