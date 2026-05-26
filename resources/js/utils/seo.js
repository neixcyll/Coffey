export function upsertHeadTag(selector, createTag, attrs = {}) {
    let element = document.head.querySelector(selector);

    if (!element) {
        element = document.createElement(createTag);
        document.head.appendChild(element);
    }

    Object.entries(attrs).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
            element.removeAttribute(key);
        } else {
            element.setAttribute(key, value);
        }
    });
}

export function applyArticleSeo(article) {
    if (!article) return;

    const url = `${window.location.origin}/blog/${article.slug}`;
    const title = article.meta_title || article.title;
    const description = article.meta_description || article.excerpt || 'Artikel kopi dari Marketplace Kopi.';
    const image = article.featured_image_url || article.featured_image;

    document.title = title;
    upsertHeadTag('meta[name="description"]', 'meta', { name: 'description', content: description });
    upsertHeadTag('link[rel="canonical"]', 'link', { rel: 'canonical', href: url });
    upsertHeadTag('meta[property="og:title"]', 'meta', { property: 'og:title', content: title });
    upsertHeadTag('meta[property="og:description"]', 'meta', { property: 'og:description', content: description });
    upsertHeadTag('meta[property="og:type"]', 'meta', { property: 'og:type', content: 'article' });
    upsertHeadTag('meta[property="og:url"]', 'meta', { property: 'og:url', content: url });
    upsertHeadTag('meta[property="og:image"]', 'meta', { property: 'og:image', content: image });

    const articleSchema = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description,
        image: image ? [image] : undefined,
        datePublished: article.published_at,
        author: {
            '@type': 'Person',
            name: article.author?.creator_profile?.display_name || article.author?.name || 'Marketplace Kopi',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Marketplace Kopi',
        },
        mainEntityOfPage: url,
    };

    const products = (article.recommended_products || [])
        .filter((item) => item.title)
        .map((item) => ({
            '@type': 'Product',
            name: item.title,
            image: item.image_url,
            description: item.description,
            offers: item.internal_available && item.price ? {
                '@type': 'Offer',
                priceCurrency: 'IDR',
                price: Number(item.price),
                availability: 'https://schema.org/InStock',
                url: `${window.location.origin}/product/${item.product?.slug || item.product_id}`,
            } : undefined,
        }));

    let schema = document.getElementById('article-schema');
    if (!schema) {
        schema = document.createElement('script');
        schema.type = 'application/ld+json';
        schema.id = 'article-schema';
        document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify(products.length ? [articleSchema, ...products] : articleSchema);
}
