export default function EmptyState({ eyebrow = 'Kosong', title, message, actionLabel, onAction }) {
    return (
        <div className="panel empty-state modern-empty-state">
            <span className="empty-state-mark">K</span>
            <div>
                <p className="eyebrow">{eyebrow}</p>
                <h2>{title}</h2>
                <p className="muted">{message}</p>
            </div>
            {actionLabel && onAction && (
                <button className="btn primary" type="button" onClick={onAction}>
                    {actionLabel}
                </button>
            )}
        </div>
    );
}
