export default function DetailPanel({ title, rows }) {
    return (
        <div className="panel detail-panel p-4 border border-[#e1d4c4] rounded-lg bg-[#fffdf9] shadow-[0_8px_24px_rgba(53,34,20,0.06)] max-w-[760px]">
            <h2 className="text-xl font-bold mb-4 text-[#38291e]">{title}</h2>
            <dl className="specs compact-specs grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3 my-2">
                {rows.map(([label, value]) => (
                    <div key={label} className="border-b border-[#eadfd4] pb-2">
                        <dt className="text-[#75695d] text-xs font-semibold">{label}</dt>
                        <dd className="m-0 font-bold text-[#38291e] mt-1">{value || '-'}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
