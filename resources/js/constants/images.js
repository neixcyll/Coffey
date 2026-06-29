const PRODUCT_FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1498804103079-a6351b050096?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1512568400610-62da28bc8a13?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=85',
    'https://images.unsplash.com/photo-1525088553748-01d6e210e00b?auto=format&fit=crop&w=1000&q=85',
];

const ROASTER_FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1518057111178-44a106bad636?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=85',
];

const ARTICLE_FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?auto=format&fit=crop&w=1200&q=85',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1200&q=85',
];

export function fallbackProductImage(product = {}) {
    return pickFallbackImage(product.slug || product.name || product.title || product.id || 'product', PRODUCT_FALLBACK_IMAGES);
}

export function fallbackRoasterImage(seller = {}, index = 0) {
    return pickFallbackImage(seller.slug || seller.name || seller.store_name || seller.id || index, ROASTER_FALLBACK_IMAGES);
}

export function fallbackArticleImage(article = {}) {
    return pickFallbackImage(article.slug || article.title || article.id || 'article', ARTICLE_FALLBACK_IMAGES);
}

export function applyFallbackImage(event, fallbackUrl) {
    const image = event.currentTarget;

    if (!fallbackUrl || image.dataset.fallbackApplied === 'true') return;

    image.dataset.fallbackApplied = 'true';
    image.src = fallbackUrl;
}

function pickFallbackImage(seed, images) {
    const value = String(seed || '');
    let hash = 0;

    for (let index = 0; index < value.length; index += 1) {
        hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }

    return images[hash % images.length];
}
