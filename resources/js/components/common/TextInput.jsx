export default function TextInput({ label, value, onChange, type = 'text', required = true }) {
    return (
        <label>
            <span>{label}</span>
            <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} />
        </label>
    );
}
