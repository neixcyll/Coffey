const defaultCategories = [
    { slug: '', name: 'Semua' },
    { slug: 'review', name: 'Review' },
    { slug: 'brewing-guide', name: 'Brewing Guide' },
    { slug: 'comparison', name: 'Comparison' },
    { slug: 'beans', name: 'Beans' },
    { slug: 'equipment', name: 'Equipment' },
    { slug: 'coffee-setup', name: 'Coffee Setup' },
    { slug: 'deals', name: 'Deals' },
];

export default function CategoryChips({ categories, selectedCategory, onSelect }) {
    const merged = mergeCategories(categories);

    return (
        <div className="category-tabs explore-category-tabs flex flex-wrap gap-2 py-1">
            {merged.map((category) => {
                const isActive = selectedCategory === category.slug;
                return (
                    <button
                        key={category.slug || 'all'}
                        type="button"
                        className={`min-h-[36px] border rounded-full px-3 py-1.5 font-bold transition-all ${
                            isActive
                                ? 'border-[#2f6d56] bg-[#eaf4ef] text-[#2f6d56]'
                                : 'border-[#d8cbbc] bg-[#fffdf9] text-[#38291e] hover:border-[#2f6d56] hover:bg-[#eaf4ef] hover:text-[#2f6d56]'
                        }`}
                        onClick={() => onSelect(category)}
                    >
                        {category.name}
                    </button>
                );
            })}
        </div>
    );
}

function mergeCategories(categories) {
    const fromApi = (categories || []).map((category) => ({
        id: category.id,
        slug: category.slug,
        name: category.name,
    }));
    const map = new Map(defaultCategories.map((category) => [category.slug, category]));

    fromApi.forEach((category) => map.set(category.slug, category));

    return [...map.values()];
}
