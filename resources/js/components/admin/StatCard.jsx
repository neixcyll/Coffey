import { clsx } from 'clsx';

export function StatCard({ label, value, subtext, icon, trend, trendLabel, variant = 'default', className = '' }) {
    const variants = {
        default: 'bg-card border-border',
        coffee: 'bg-coffee-50 border-coffee-200 dark:bg-coffee-950/30 dark:border-coffee-800',
        success: 'bg-sage-50 border-sage-200 dark:bg-sage-950/30 dark:border-sage-800',
        warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
        info: 'bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800',
        destructive: 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800',
    };

    return (
        <div
            className={clsx(
                'p-5 border rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md',
                variants[variant],
                className
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {label}
                    </p>
                    <p className="mt-1.5 text-2xl font-extrabold text-foreground truncate">
                        {value}
                    </p>
                    {subtext && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>
                    )}
                </div>
                {icon && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-primary">
                        {icon}
                    </div>
                )}
            </div>
            {trend !== undefined && (
                <div className="mt-3 flex items-center gap-1.5">
                    <span className={clsx(
                        'inline-flex items-center text-xs font-semibold',
                        trend >= 0 ? 'text-sage-600 dark:text-sage-400' : 'text-rose-600 dark:text-rose-400'
                    )}>
                        {trend >= 0 ? (
                            <svg className="w-3.5 h-3.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="18 15 12 9 6 15" />
                            </svg>
                        ) : (
                            <svg className="w-3.5 h-3.5 mr-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        )}
                        {Math.abs(trend)}%
                    </span>
                    {trendLabel && (
                        <span className="text-xs text-muted-foreground">{trendLabel}</span>
                    )}
                </div>
            )}
        </div>
    );
}