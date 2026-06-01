export default function TextArea({ label, value, onChange, required = false, helper, error, placeholder, onBlur, rows = 4 }) {
    return (
        <label className={`field-control ${error ? 'has-error' : ''}`}>
            <span>{label}</span>
            <textarea
                value={value}
                placeholder={placeholder}
                rows={rows}
                required={required}
                aria-invalid={Boolean(error)}
                onBlur={onBlur}
                onChange={(event) => onChange(event.target.value)}
            />
            {error ? <small className="field-error">{error}</small> : helper && <small className="field-helper">{helper}</small>}
        </label>
    );
}
