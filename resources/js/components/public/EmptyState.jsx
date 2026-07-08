export default function EmptyState({ eyebrow = 'Kosong', title, message, actionLabel, onAction }) {
    return (
        <div className="panel empty-state modern-empty-state p-6 border border-[#e1d4c4] rounded-lg bg-[#fffdf9] shadow-[0_8px_24px_rgba(53,34,20,0.06)] max-w-[520px] grid justify-items-start gap-3.5">
            <span className="empty-state-mark grid w-12 h-12 place-items-center rounded-lg text-white bg-[#5b3825] font-black">K</span>
            <div className="grid gap-1">
                <p className="eyebrow text-xs font-black uppercase text-[#b77825] tracking-wider">{eyebrow}</p>
                <h2 className="text-xl font-bold text-[#38291e]">{title}</h2>
                <p className="muted text-sm text-[#75695d] leading-relaxed">{message}</p>
            </div>
            {actionLabel && onAction && (
                <button className="btn primary" type="button" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
