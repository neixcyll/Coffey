import { forwardRef } from 'react';

export const Badge = forwardRef(function Badge({
    variant = 'default',
    className = '',
    children,
    ...props
}, ref) {
    const variants = {
        default: 'bg-muted text-muted-foreground border border-border',
        primary: 'bg-primary text-primary-foreground',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-sage-100 text-sage-800 dark:bg-sage-900/30 dark:text-sage-300 border border-sage-200 dark:border-sage-800',
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
        destructive: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
        info: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
        coffee: 'bg-coffee-100 text-coffee-800 dark:bg-coffee-900/30 dark:text-coffee-300 border border-coffee-200 dark:border-coffee-800',
        outline: 'bg-transparent border border-border text-foreground',
    };

    return (
        <span
            ref={ref}
            className={`
                inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
                transition-colors duration-150
                ${variants[variant]}
                ${className}
            `}
            {...props}
        >
            {children}
        </span>
    );
});

Badge.displayName = 'Badge';

const statusConfig = {
    active: { variant: 'success', label: 'Active' },
    inactive: { variant: 'default', label: 'Inactive' },
    suspended: { variant: 'destructive', label: 'Suspended' },
    pending: { variant: 'warning', label: 'Pending' },
    approved: { variant: 'success', label: 'Approved' },
    rejected: { variant: 'destructive', label: 'Rejected' },
    published: { variant: 'success', label: 'Published' },
    draft: { variant: 'default', label: 'Draft' },
    featured: { variant: 'coffee', label: 'Featured' },
    normal: { variant: 'default', label: 'Normal' },
    paid: { variant: 'success', label: 'Paid' },
    unpaid: { variant: 'warning', label: 'Unpaid' },
    refunded: { variant: 'destructive', label: 'Refunded' },
    processing: { variant: 'info', label: 'Processing' },
    shipped: { variant: 'info', label: 'Shipped' },
    delivered: { variant: 'success', label: 'Delivered' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
};

export function StatusBadge({ status, className = '', ...props }) {
    const config = statusConfig[status?.toLowerCase()] || { variant: 'default', label: status };
    return <Badge variant={config.variant} className={className} {...props}>{config.label}</Badge>;
}