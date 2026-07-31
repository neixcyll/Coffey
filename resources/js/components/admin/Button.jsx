import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { clsx } from 'clsx';

export const Button = forwardRef(function Button({
    variant = 'primary',
    size = 'md',
    asChild = false,
    className = '',
    disabled,
    loading = false,
    icon,
    iconPosition = 'left',
    children,
    ...props
}, ref) {
    const Comp = asChild ? Slot : 'button';

    const baseStyles = `
        inline-flex items-center justify-center gap-2 font-semibold
        focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-150
        rounded-xl
    `;

    const variants = {
        primary: `
            bg-coffee-700 text-white border border-coffee-700
            hover:bg-coffee-800 hover:border-coffee-800
            active:bg-coffee-900
            focus:ring-coffee-500
        `,
        secondary: `
            bg-coffee-100 text-coffee-900 border border-coffee-200
            hover:bg-coffee-200 hover:border-coffee-300
            active:bg-coffee-300
            focus:ring-coffee-400
        `,
        outline: `
            bg-transparent text-coffee-700 border border-coffee-300
            hover:bg-coffee-50 hover:border-coffee-400
            active:bg-coffee-100
            focus:ring-coffee-400
        `,
        ghost: `
            bg-transparent text-coffee-700 border border-transparent
            hover:bg-coffee-100
            active:bg-coffee-200
            focus:ring-coffee-400
        `,
        destructive: `
            bg-rose-600 text-white border border-rose-600
            hover:bg-rose-700 hover:border-rose-700
            active:bg-rose-800
            focus:ring-rose-500
        `,
        success: `
            bg-sage-600 text-white border border-sage-600
            hover:bg-sage-700 hover:border-sage-700
            active:bg-sage-800
            focus:ring-sage-500
        `,
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs gap-1.5',
        md: 'px-4 py-2 text-sm gap-2',
        lg: 'px-6 py-3 text-base gap-2',
        xl: 'px-8 py-4 text-lg gap-2.5',
        icon: 'p-2',
    };

    return (
        <Comp
            ref={ref}
            className={clsx(baseStyles, variants[variant], sizes[size], className)}
            disabled={disabled || loading}
            aria-busy={loading}
            {...props}
        >
            {loading ? (
                <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            ) : icon && iconPosition === 'left' ? (
                <span aria-hidden="true">{icon}</span>
            ) : null}
            {children}
            {icon && iconPosition === 'right' && <span aria-hidden="true">{icon}</span>}
        </Comp>
    );
});

Button.displayName = 'Button';

export const IconButton = forwardRef(function IconButton({
    variant = 'ghost',
    size = 'md',
    className = '',
    children,
    'aria-label': ariaLabel,
    ...props
}, ref) {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    };

    return (
        <Button
            ref={ref}
            variant={variant}
            size={size}
            className={clsx(sizes[size], 'p-0', className)}
            aria-label={ariaLabel}
            {...props}
        >
            {children}
        </Button>
    );
});

IconButton.displayName = 'IconButton';