import { forwardRef } from 'react';

export const Input = forwardRef(function Input({
    label,
    error,
    hint,
    className = '',
    id,
    ...props
}, ref) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {label}
                </label>
            )}
            <input
                ref={ref}
                id={inputId}
                className={`
                    w-full px-3 py-2 text-sm bg-background border rounded-xl
                    placeholder:text-muted-foreground/50
                    focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors duration-150
                    ${error ? 'border-destructive focus:ring-destructive' : 'border-input'}
                    ${className}
                `}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                {...props}
            />
            {error && (
                <p id={`${inputId}-error`} className="mt-1.5 text-xs text-destructive" role="alert">
                    {error}
                </p>
            )}
            {hint && !error && (
                <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-muted-foreground">
                    {hint}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export const Textarea = forwardRef(function Textarea({
    label,
    error,
    hint,
    className = '',
    id,
    rows = 4,
    ...props
}, ref) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {label}
                </label>
            )}
            <textarea
                ref={ref}
                id={inputId}
                rows={rows}
                className={`
                    w-full px-3 py-2 text-sm bg-background border rounded-xl
                    placeholder:text-muted-foreground/50
                    focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors duration-150 resize-y
                    ${error ? 'border-destructive focus:ring-destructive' : 'border-input'}
                    ${className}
                `}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
                {...props}
            />
            {error && (
                <p id={`${inputId}-error`} className="mt-1.5 text-xs text-destructive" role="alert">
                    {error}
                </p>
            )}
            {hint && !error && (
                <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-muted-foreground">
                    {hint}
                </p>
            )}
        </div>
    );
});

Textarea.displayName = 'Textarea';

export const Select = forwardRef(function Select({
    label,
    error,
    hint,
    options = [],
    placeholder,
    className = '',
    id,
    ...props
}, ref) {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={selectId} className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {label}
                </label>
            )}
            <select
                ref={ref}
                id={selectId}
                className={`
                    w-full px-3 py-2 text-sm bg-background border rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors duration-150 appearance-none
                    ${error ? 'border-destructive focus:ring-destructive' : 'border-input'}
                    ${className}
                `}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
                {...props}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p id={`${selectId}-error`} className="mt-1.5 text-xs text-destructive" role="alert">
                    {error}
                </p>
            )}
            {hint && !error && (
                <p id={`${selectId}-hint`} className="mt-1.5 text-xs text-muted-foreground">
                    {hint}
                </p>
            )}
        </div>
    );
});

Select.displayName = 'Select';

export const Checkbox = forwardRef(function Checkbox({
    label,
    className = '',
    id,
    ...props
}, ref) {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <label className="inline-flex items-center gap-3 cursor-pointer">
            <input
                ref={ref}
                type="checkbox"
                id={checkboxId}
                className={`
                    w-5 h-5 text-primary border-input rounded
                    focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors duration-150
                    ${className}
                `}
                {...props}
            />
            {label && (
                <span className="text-sm text-foreground" htmlFor={checkboxId}>
                    {label}
                </span>
            )}
        </label>
    );
});

Checkbox.displayName = 'Checkbox';