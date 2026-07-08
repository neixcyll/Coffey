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
        <label className={`field-control grid gap-1.5 ${error ? 'has-error' : ''}`}>
            <span className="block mb-1.5 text-[#4d4035] text-[0.86rem] font-bold">{label}</span>
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
                className={`w-full border rounded-lg px-3 py-2.5 bg-[#fffdf9] color-[#261c15] focus:outline-none focus:ring-2 focus:ring-[#5b3825] focus:border-transparent transition-all ${
                    error ? 'border-[#c67c6d] bg-[rgba(198,124,109,0.08)]' : 'border-[#d8cbbc]'
                }`}
            />
            {error ? (
                <small className="field-error block text-[0.74rem] leading-[1.45] text-[#b91c1c]">{error}</small>
            ) : helper ? (
                <small className="field-helper block text-[0.74rem] leading-[1.45] text-gray-500">{helper}</small>
            ) : null}
        </label>
    );
}
