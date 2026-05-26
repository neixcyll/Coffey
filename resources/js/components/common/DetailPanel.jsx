export default function DetailPanel({ title, rows }) {
    return (
        <div className="panel detail-panel">
            <h2>{title}</h2>
            <dl className="specs compact-specs">
                {rows.map(([label, value]) => (
                    <div key={label}><dt>{label}</dt><dd>{value || '-'}</dd></div>
                ))}
            </dl>
        </div>
    );
}
