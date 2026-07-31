import { clsx } from 'clsx';

export function EmptyState({
    icon,
    title = 'No data',
    message = 'No data available.',
    action,
    className = '',
}) {
    return (
        <div className={clsx('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
            {icon ? (
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
                    {icon}
                </div>
            ) : (
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
                    <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                        <polyline points="13 2 13 9 20 9" />
                    </svg>
                </div>
            )}
            <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}