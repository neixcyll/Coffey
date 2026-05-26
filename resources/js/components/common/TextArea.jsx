export default function TextArea({ label, value, onChange, required = false }) {
    return (
        <label>
            <span>{label}</span>
            <textarea value={value} onChange={(event) => onChange(event.target.value)} rows="4" required={required} />
        </label>
    );
}
