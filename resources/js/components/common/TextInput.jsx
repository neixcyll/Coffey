export default function TextInput({
    label,
    value,
    onChange,
    type = 'text',
    required = true,
    helper,
    error,
    placeholder,
    onBlur,
    inputMode,
    autoComplete,
}) {
    return (
        <label className={`field-control ${error ? 'has-error' : ''}`}>
            <span>{label}</span>
            <input
                type={type}
                value={value}
                required={required}
                placeholder={placeholder}
                inputMode={inputMode}
                autoComplete={autoComplete}
                aria-invalid={Boolean(error)}
                onBlur={onBlur}
                onChange={(event) => onChange(event.target.value)}
            />
            {error ? <small className="field-error">{error}</small> : helper && <small className="field-helper">{helper}</small>}
        </label>
    );
}
