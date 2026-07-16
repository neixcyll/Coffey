export default function Stat({ label, value }) {
    return (
        <div className="p-5 border border-gray-200 rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md">
            <span className="block text-gray-500 font-semibold text-xs tracking-wider uppercase mb-1">{label}</span>
            <strong className="block mt-1 text-2xl font-extrabold text-black">{value}</strong>
        </div>
    );
}
