export default function DetailPanel({ title, rows, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Background Blur Overlay */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-all" onClick={onClose} />
            
            {/* Panel Content */}
            <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-2xl shadow-2xl p-6 overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-black">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-black">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                </div>
                <dl className="grid grid-cols-1 gap-6">
                    {rows.map(([label, value]) => (
                        <div key={label} className="border-b border-gray-100 pb-4">
                            <dt className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</dt>
                            <dd className="m-0 font-semibold text-gray-900 mt-1">{value || '-'}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
    );
}
