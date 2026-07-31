export default function Stat({ label, value, accent = false }) {
    return (
        <div className={`p-5 border border-gray-200 rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md ${accent ? 'border-t-4 border-t-[#9c4f2e]' : ''}`}>
            <span className={`block text-xs font-semibold tracking-wider uppercase mb-1 ${accent ? 'text-[#8a5a3a]' : 'text-gray-500'}`}>{label}</span>
            <strong className="block mt-1 text-2xl font-extrabold text-black">{value}</strong>
        </div>
    );
}
