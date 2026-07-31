import { clsx } from 'clsx';

export function Card({ className = '', children, ...props }) {
    return (
        <div
            className={clsx(
                'bg-card border border-border rounded-2xl shadow-sm',
                'transition-shadow duration-200 hover:shadow-md',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className = '', children, action, ...props }) {
    return (
        <div
            className={clsx('px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3', className)}
            {...props}
        >
            <div>{children}</div>
            {action && <div className="flex-shrink-0">{action}</div>}
        </div>
    );
}

export function CardTitle({ className = '', children, ...props }) {
    return (
        <h3
            className={clsx('text-lg font-bold text-foreground', className)}
            {...props}
        >
            {children}
        </h3>
    );
}

export function CardDescription({ className = '', children, ...props }) {
    return (
        <p
            className={clsx('text-sm text-muted-foreground mt-1', className)}
            {...props}
        >
            {children}
        </p>
    );
}

export function CardContent({ className = '', children, ...props }) {
    return (
        <div
            className={clsx('px-6 py-4', className)}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardFooter({ className = '', children, ...props }) {
    return (
        <div
            className={clsx('px-6 py-4 border-t border-border flex items-center gap-3', className)}
            {...props}
        >
            {children}
        </div>
    );
}