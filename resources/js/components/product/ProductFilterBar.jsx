import { ROAST_LEVEL_OPTIONS } from '../../constants/options.js';
import { optionLabel } from '../../utils/format.js';

export default function ProductFilterBar({ categories, filters, setFilters, onReset }) {
    const chips = activeChips(categories, filters);

    function update(field, value) {
        setFilters((current) => ({ ...current, [field]: value }));
    }

    return (
        <section className="marketplace-filter-panel" aria-label="Filter produk">
            <div className="marketplace-filters">
                <input
                    placeholder="Cari kopi, origin, atau deskripsi"
                    value={filters.search}
                    onChange={(event) => update('search', event.target.value)}
                />
                <select value={filters.category} onChange={(event) => update('category', event.target.value)}>
                    <option value="">Semua kategori</option>
                    {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                </select>
                <select value={filters.roast_level} onChange={(event) => update('roast_level', event.target.value)}>
                    <option value="">Roast level</option>
                    {ROAST_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <input placeholder="Origin" value={filters.origin} onChange={(event) => update('origin', event.target.value)} />
                <button className="btn ghost" type="button" onClick={onReset}>Reset Filter</button>
            </div>

            {chips.length > 0 && (
                <div className="active-filter-row">
                    {chips.map((chip) => (
                        <button className="active-filter-chip" key={chip.key} type="button" onClick={() => update(chip.key, '')}>
                            {chip.label}
                            <span aria-hidden="true">x</span>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}

function activeChips(categories, filters) {
    const chips = [];
    const category = categories.find((item) => item.slug === filters.category);

    if (filters.search) chips.push({ key: 'search', label: `Search: ${filters.search}` });
    if (filters.category) chips.push({ key: 'category', label: category?.name || filters.category });
    if (filters.roast_level) chips.push({ key: 'roast_level', label: optionLabel(ROAST_LEVEL_OPTIONS, filters.roast_level) });
    if (filters.origin) chips.push({ key: 'origin', label: `Origin: ${filters.origin}` });

    return chips;
}
