export default function Stat({ label, value }) {
    return (
        <div className="stat p-4 border border-[#e1d4c4] rounded-lg bg-[#fffdf9] shadow-[0_8px_24px_rgba(53,34,20,0.06)]">
            <span className="block text-[#75695d] font-bold text-sm">{label}</span>
            <strong className="block mt-2 text-2xl font-extrabold text-[#38291e]">{value}</strong>
        </div>
    );
}
