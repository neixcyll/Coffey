export function formatPrice(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

export function formatWeight(grams) {
    const value = Number(grams || 0);

    if (value >= 1000 && value % 1000 === 0) {
        return `${value / 1000} kg`;
    }

    if (value >= 1000) {
        return `${(value / 1000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} kg`;
    }

    return `${value} gram`;
}

export function optionLabel(options, value) {
    return options.find((option) => option.value === value)?.label || value || '-';
}

export function rowsFrom(response) {
    return response?.data || [];
}
