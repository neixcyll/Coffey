import { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export function DataTable({
    columns = [],
    data = [],
    onRowClick,
    emptyState = 'No data available.',
    loading = false,
    sortable = false,
    pagination = false,
    pageSize = 10,
    className = '',
    rowClassName,
    minWidth = '800px',
}) {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);

    const sortedData = useMemo(() => {
        if (!sortable || !sortConfig.key) return data;
        return [...data].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig, sortable]);

    const paginatedData = useMemo(() => {
        if (!pagination) return sortedData;
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, pagination, currentPage, pageSize]);

    const totalPages = pagination ? Math.ceil(sortedData.length / pageSize) : 1;

    const handleSort = (key) => {
        if (!sortable) return;
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    const SortIcon = ({ column }) => {
        if (!sortable || !column.sortable) return null;
        const isActive = sortConfig.key === column.accessor;
        return (
            <span className="inline-flex flex-col ml-1 -space-y-1">
                <ChevronUp className={clsx('w-3 h-3', isActive && sortConfig.direction === 'asc' ? 'text-primary' : 'text-muted-foreground/50')} />
                <ChevronDown className={clsx('w-3 h-3', isActive && sortConfig.direction === 'desc' ? 'text-primary' : 'text-muted-foreground/50')} />
            </span>
        );
    };

    if (loading) {
        return (
            <div className={clsx('border border-border rounded-2xl overflow-hidden', className)}>
                <div className="bg-muted/50">
                    <div className="flex px-6 py-4 border-b border-border gap-4">
                        {columns.map((col, i) => (
                            <div key={i} style={{ flex: col.width || 1 }} className="h-4 bg-muted rounded animate-pulse" />
                        ))}
                    </div>
                </div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex px-6 py-4 border-b border-border last:border-0 gap-4">
                        {columns.map((col, j) => (
                            <div key={j} style={{ flex: col.width || 1 }} className="h-4 bg-muted/60 rounded animate-pulse" />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={clsx('bg-card border border-border rounded-2xl shadow-sm overflow-hidden', className)}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{ minWidth }}>
                    <thead>
                        <tr className="bg-muted/50 border-b border-border">
                            {columns.map((column) => (
                                <th
                                    key={column.accessor || column.header}
                                    className={clsx(
                                        'px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider',
                                        (sortable && column.sortable) && 'cursor-pointer select-none hover:text-foreground transition-colors',
                                        column.align === 'right' && 'text-right',
                                        column.align === 'center' && 'text-center'
                                    )}
                                    onClick={() => column.sortable !== false && handleSort(column.accessor)}
                                    style={{ width: column.width }}
                                >
                                    <span className="inline-flex items-center">
                                        {column.header}
                                        {(sortable && column.sortable !== false) && <SortIcon column={column} />}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                                                <polyline points="13 2 13 9 20 9" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{emptyState}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, rowIndex) => (
                                <tr
                                    key={row.id || rowIndex}
                                    className={clsx(
                                        'transition-colors duration-150',
                                        onRowClick ? 'cursor-pointer hover:bg-accent/50' : 'hover:bg-muted/30',
                                        rowClassName?.(row) || ''
                                    )}
                                    onClick={() => onRowClick?.(row)}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.accessor || column.header}
                                            className={clsx(
                                                'px-6 py-4 text-sm',
                                                column.align === 'right' && 'text-right',
                                                column.align === 'center' && 'text-center'
                                            )}
                                        >
                                            {column.render ? column.render(row) : row[column.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && totalPages > 1 && (
                <div className="px-6 py-4 border-t border-border flex items-center justify-between flex-wrap gap-4">
                    <p className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                        <span className="font-semibold text-foreground">
                            {Math.min(currentPage * pageSize, sortedData.length)}
                        </span>{' '}
                        of <span className="font-semibold text-foreground">{sortedData.length}</span> results
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 text-sm font-semibold border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Previous page"
                        >
                            Prev
                        </button>
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i === 4 ? totalPages : i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = i === 0 ? 1 : totalPages - 4 + i;
                            } else {
                                pageNum = i === 0 ? 1 : i === 4 ? totalPages : currentPage - 1 + i;
                            }
                            return (
                                <button
                                    key={pageNum}
                                    type="button"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={clsx(
                                        'px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors',
                                        currentPage === pageNum
                                            ? 'bg-primary text-primary-foreground'
                                            : 'border border-border hover:bg-accent'
                                    )}
                                    aria-label={`Page ${pageNum}`}
                                    aria-current={currentPage === pageNum ? 'page' : undefined}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 text-sm font-semibold border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Next page"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}