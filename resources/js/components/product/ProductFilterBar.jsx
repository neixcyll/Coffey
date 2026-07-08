import { ROAST_LEVEL_OPTIONS } from '../../constants/options.js';
import { optionLabel } from '../../utils/format.js';

export default function ProductFilterBar({ categories, filters, setFilters, onReset }) {
    const chips = activeChips(categories, filters);

    function update(field, value) {
        setFilters((current) => ({ ...current, [field]: value }));
    }

    return (
        <section className="marketplace-filter-panel grid gap-3 border border-[#e1d4c4] rounded-lg p-3.5 bg-[#fffdf9] shadow-[0_10px_34px_rgba(53,34,20,0.06)]" aria-label="Filter produk">
            <div className="marketplace-filters grid grid-cols-1 md:grid-cols-[minmax(240px,1.4fr)_repeat(3,minmax(150px,1fr))_auto] gap-2.5 items-center">
                <input
                    placeholder="Cari kopi, origin, atau deskripsi"
                    value={filters.search}
                    onChange={(event) => update('search', event.target.value)}
                    className="w-full border border-[#d8cbbc] rounded-lg px-3 py-2.5 bg-[#fffdf9] color-[#261c15] focus:outline-none focus:ring-2 focus:ring-[#5b3825] focus:border-transparent transition-all"
                />
                <select 
                    value={filters.category} 
                    onChange={(event) => update('category', event.target.value)}
                    className="w-full border border-[#d8cbbc] rounded-lg px-3 py-2.5 bg-[#fffdf9] color-[#261c15] focus:outline-none focus:ring-2 focus:ring-[#5b3825] focus:border-transparent transition-all"
                >
                    <option value="">Semua kategori</option>
                    {categories.map((category) => <option key={category.id} value={category.slug}>{category.name}</option>)}
                </select>
                <select 
                    value={filters.roast_level} 
                    onChange={(event) => update('roast_level', event.target.value)}
                    className="w-full border border-[#d8cbbc] rounded-lg px-3 py-2.5 bg-[#fffdf9] color-[#261c15] focus:outline-none focus:ring-2 focus:ring-[#5b3825] focus:border-transparent transition-all"
                >
                    <option value="">Roast level</option>
                    {ROAST_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <input 
                    placeholder="Origin" 
                    value={filters.origin} 
                    onChange={(event) => update('origin', event.target.value)} 
                    className="w-full border border-[#d8cbbc] rounded-lg px-3 py-2.5 bg-[#fffdf9] color-[#261c15] focus:outline-none focus:ring-2 focus:ring-[#5b3825] focus:border-transparent transition-all"
                />
                <button className="btn ghost" type="button" onClick={onReset}>Reset Filter</button>
            </div>

            {chips.length > 0 && (
                <div className="active-filter-row flex flex-wrap gap-2 mt-1">
                    {chips.map((chip) => (
                        <button className="active-filter-chip inline-flex items-center gap-2 border border-[#b7d4c4] rounded-full px-2.5 py-1.5 text-xs font-bold text-[#2f6d56] bg-[#eaf4ef] hover:bg-[#d8eadb] transition-colors cursor-pointer" key={chip.key} type="button" onClick={() => update(chip.key, '')}>
                            {chip.label}
                            <span aria-hidden="true" className="font-semibold ml-0.5">×</span>
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
