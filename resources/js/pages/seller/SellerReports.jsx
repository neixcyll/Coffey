import NeedLogin from '../../components/common/NeedLogin.jsx';

export default function SellerReports({ token, navigate, setNotice }) {
    if (!token) return <NeedLogin navigate={navigate} />;

    return (
        <section className="p-6 md:p-8 max-w-6xl mx-auto w-full">
            <div className="mb-6">
                <p className="text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">Seller Reports</p>
                <h1 className="text-2xl md:text-3xl font-extrabold text-black tracking-tight">Laporan</h1>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { title: 'Laporan Penjualan', desc: 'Rekap penjualan harian, mingguan, dan bulanan', color: 'text-black border-black' },
                    { title: 'Laporan Stok', desc: 'Mutasi stok produk masuk dan keluar', color: 'text-black border-black' },
                    { title: 'Laporan Keuangan', desc: 'Ringkasan pendapatan, payout, dan fee', color: 'text-black border-black' },
                ].map((item) => (
                    <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow cursor-not-allowed opacity-70">
                        <h3 className="font-bold text-gray-900 text-base mb-1">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                        <span className="inline-block mt-3 text-[10px] font-bold uppercase text-gray-400">Coming Soon</span>
                    </div>
                ))}
            </div>
        </section>
    );
}
