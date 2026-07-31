import { useState } from 'react';
import { clsx } from 'clsx';
import { Search, X, SlidersHorizontal } from 'lucide-react';

export function FilterBar({
    searchValue = '',
    onSearchChange,
    searchPlaceholder = 'Cari...',
    filters = [],
    onFilterChange,
    onReset,
    className = '',
    showFilters = true,
}) {
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const handleSearch = (e) => {
        onSearchChange?.(e.target.value);
    };

    const handleFilterChange = (key, value) => {
        onFilterChange?.({ ...Object.fromEntries(filters.map(f => [f.key, f.value])), [key]: value });
    };

    const hasActiveFilters = filters.some(f => f.value !== '' && f.value !== undefined);

    return (
        <div className={clsx('space-y-3', className)}>
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={handleSearch}
                        placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-4 py-2 text-sm bg-background border border-border rounded-xl
                            placeholder:text-muted-foreground/50
                            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                            transition-colors duration-150"
                        aria-label="Search"
                    />
                    {searchValue && (
                        <button
                            type="button"
                            onClick={() => onSearchChange?.('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label="Clear search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-2">
                    {showFilters && filters.length > 0 && (
                        <>
                            {/* Desktop filters */}
                            <div className="hidden sm:flex items-center gap-2">
                                {filters.map((filter) => (
                                    <div key={filter.key}>
                                        {filter.type === 'select' ? (
                                            <select
                                                value={filter.value || ''}
                                                onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                                className="px-3 py-2 text-sm bg-background border border-border rounded-xl
                                                    focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                                                    transition-colors duration-150 appearance-none cursor-pointer"
                                                aria-label={filter.label}
                                            >
                                                <option value="">{filter.placeholder || filter.label}</option>
                                                {filter.options?.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : null}
                                    </div>
                                ))}
                            </div>

                            {/* Mobile filter toggle */}
                            <button
                                type="button"
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className={clsx(
                                    'sm:hidden p-2 border border-border rounded-xl transition-colors',
                                    showMobileFilters ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'
                                )}
                                aria-label="Toggle filters"
                                aria-expanded={showMobileFilters}
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={onReset}
                            className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile filters */}
            {showMobileFilters && filters.length > 0 && (
                <div className="sm:hidden grid grid-cols-2 gap-2 p-3 bg-muted rounded-xl border border-border">
                    {filters.map((filter) => (
                        <div key={filter.key}>
                            {filter.type === 'select' ? (
                                <select
                                    value={filter.value || ''}
                                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl
                                        focus:outline-none focus:ring-2 focus:ring-ring
                                        transition-colors duration-150 appearance-none cursor-pointer"
                                    aria-label={filter.label}
                                >
                                    <option value="">{filter.placeholder || filter.label}</option>
                                    {filter.options?.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}