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
        <div className="category-tabs explore-category-tabs">
            {merged.map((category) => (
                <button
                    key={category.slug || 'all'}
                    type="button"
                    className={selectedCategory === category.slug ? 'active' : ''}
                    onClick={() => onSelect(category)}
                >
                    {category.name}
                </button>
            ))}
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
