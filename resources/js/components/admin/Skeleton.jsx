import { clsx } from 'clsx';

export function Skeleton({ className = '', ...props }) {
    return (
        <div
            className={clsx(
                'animate-pulse rounded-xl bg-muted',
                className
            )}
            {...props}
        />
    );
}

export function SkeletonCard({ lines = 3, className = '' }) {
    return (
        <div className={clsx('p-5 border border-border rounded-2xl space-y-3', className)}>
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-8 w-2/3" />
            {[...Array(lines - 1)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
            ))}
        </div>
    );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
    return (
        <div className={clsx('border border-border rounded-2xl overflow-hidden', className)}>
            <div className="bg-muted/50 px-6 py-4 border-b border-border">
                <div className="flex gap-4">
                    {[...Array(cols)].map((_, i) => (
                        <Skeleton key={i} className="h-4 flex-1" />
                    ))}
                </div>
            </div>
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="px-6 py-4 border-b border-border last:border-0">
                    <div className="flex gap-4">
                        {[...Array(cols)].map((_, j) => (
                            <Skeleton key={j} className="h-4 flex-1" style={{ opacity: 1 - (j * 0.15) }} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export function SkeletonGrid({ count = 8, className = '' }) {
    return (
        <div className={clsx('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
            {[...Array(count)].map((_, i) => (
                <SkeletonCard key={i} lines={2} />
            ))}
        </div>
    );
}