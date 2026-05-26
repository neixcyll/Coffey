const API_BASE = '/api';

export async function apiRequest(path, { method = 'GET', body, token, isForm = false } = {}) {
    const headers = { Accept: 'application/json' };

    if (token) headers.Authorization = `Bearer ${token}`;
    if (body && !isForm) headers['Content-Type'] = 'application/json';

    const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        const validation = data.errors ? Object.values(data.errors).flat().join(' ') : null;
        throw new Error(validation || data.message || 'Request gagal.');
    }

    return data;
}
