import { useEffect, useState } from 'react';
import { ROAST_LEVEL_OPTIONS } from '../../constants/options.js';
import TextArea from '../common/TextArea.jsx';
import TextInput from '../common/TextInput.jsx';

const PRODUCT_IMAGE_LIMIT_BYTES = 1.8 * 1024 * 1024;

export default function ProductForm({ categories, brewingMethods = [], product, onSubmit, feedback }) {
    const [form, setForm] = useState(defaultProductForm(product));
    const [file, setFile] = useState(null);
    const [fileMessage, setFileMessage] = useState('');
    const [fileError, setFileError] = useState('');
    const [processingImage, setProcessingImage] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(0);

    useEffect(() => {
        setForm(defaultProductForm(product));
        setFile(null);
        setFileMessage('');
        setFileError('');
        setFileInputKey((current) => current + 1);
    }, [product]);

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    function toggleBrewing(methodId) {
        const id = String(methodId);
        setForm((current) => ({
            ...current,
            brewing_method_ids: current.brewing_method_ids.includes(id)
                ? current.brewing_method_ids.filter((item) => item !== id)
                : [...current.brewing_method_ids, id],
        }));
    }

    function updateVariant(index, field, value) {
        setForm((current) => ({
            ...current,
            variants: current.variants.map((variant, variantIndex) => (
                variantIndex === index ? { ...variant, [field]: value } : variant
            )),
        }));
    }

    function addVariant() {
        setForm((current) => ({
            ...current,
            variants: [...current.variants, emptyVariant()],
        }));
    }

    function removeVariant(index) {
        setForm((current) => ({
            ...current,
            variants: current.variants.length === 1
                ? current.variants
                : current.variants.filter((_, variantIndex) => variantIndex !== index),
        }));
    }

    function submit(event) {
        event.preventDefault();
        if (processingImage || fileError) return;

        const payload = new FormData();
        ['category_id', 'name', 'description', 'roast_level', 'origin'].forEach((key) => {
            payload.append(key, form[key]);
        });

        payload.append('brewing_methods_present', '1');
        form.brewing_method_ids.forEach((id) => payload.append('brewing_methods[]', id));

        form.variants.forEach((variant, index) => {
            const grams = variant.weight_unit === 'kg'
                ? Math.round(Number(variant.weight || 0) * 1000)
                : Number(variant.weight || 0);

            if (variant.id) payload.append(`variants[${index}][id]`, variant.id);
            payload.append(`variants[${index}][weight_grams]`, grams);
            payload.append(`variants[${index}][grind_size]`, variant.grind_size);
            payload.append(`variants[${index}][price]`, variant.price);
            payload.append(`variants[${index}][stock]`, variant.stock);
            if (variant.sku) payload.append(`variants[${index}][sku]`, variant.sku);
        });

        if (file) payload.append('image', file);
        onSubmit(payload, product?.id);
    }

    async function handleFileChange(event) {
        const selectedFile = event.target.files?.[0] || null;
        setFileMessage('');
        setFileError('');
        setFile(null);

        if (!selectedFile) return;

        if (!selectedFile.type.startsWith('image/')) {
            setFileError('File harus berupa gambar.');
            setFileInputKey((current) => current + 1);
            return;
        }

        if (selectedFile.size <= PRODUCT_IMAGE_LIMIT_BYTES) {
            setFile(selectedFile);
            return;
        }

        setProcessingImage(true);

        try {
            const compressedFile = await compressImageFile(selectedFile);

            if (compressedFile.size > PRODUCT_IMAGE_LIMIT_BYTES) {
                setFileError('Gambar masih terlalu besar. Gunakan gambar maksimal 2MB.');
                setFileInputKey((current) => current + 1);
                return;
            }

            setFile(compressedFile);
            setFileMessage('Gambar besar dikompresi otomatis sebelum upload.');
        } catch {
            setFileError('Gagal memproses gambar. Gunakan gambar maksimal 2MB.');
            setFileInputKey((current) => current + 1);
        } finally {
            setProcessingImage(false);
        }
    }

    return (
        <form className="panel form-grid" onSubmit={submit}>
            <h2>Informasi produk</h2>
            <select value={form.category_id} onChange={(event) => update('category_id', event.target.value)} required>
                <option value="">Pilih kategori</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <TextInput label="Name" value={form.name} onChange={(value) => update('name', value)} />
            <TextArea label="Deskripsi" value={form.description} onChange={(value) => update('description', value)} required />
            <div className="grid-2">
                <label>
                    <span>Roast level</span>
                    <select value={form.roast_level} onChange={(event) => update('roast_level', event.target.value)} required>
                        <option value="">Pilih roast level</option>
                        {ROAST_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
                <TextInput label="Origin" value={form.origin} onChange={(value) => update('origin', value)} />
            </div>

            <div className="field-block">
                <span>Brewing method</span>
                <div className="option-pills">
                    {brewingMethods.map((method) => {
                        const selected = form.brewing_method_ids.includes(String(method.id));

                        return (
                            <label className={`pill-check ${selected ? 'selected' : ''}`} key={method.id}>
                                <input type="checkbox" checked={selected} onChange={() => toggleBrewing(method.id)} />
                                <span>{method.name}</span>
                            </label>
                        );
                    })}
                    {brewingMethods.length === 0 && <p className="muted">Brewing method belum tersedia.</p>}
                </div>
            </div>

            <div className="variant-editor">
                <div className="section-head compact-head">
                    <h3>Variant berat dan gilingan</h3>
                    <button type="button" className="btn ghost compact-btn" onClick={addVariant}>Add variant</button>
                </div>
                <div className="variant-list">
                    {form.variants.map((variant, index) => (
                        <div className="variant-row" key={variant.client_id}>
                            <div className="unit-row">
                                <label>
                                    <span>Berat</span>
                                    <input type="number" min="1" value={variant.weight} onChange={(event) => updateVariant(index, 'weight', event.target.value)} required />
                                </label>
                                <label>
                                    <span>Satuan</span>
                                    <select value={variant.weight_unit} onChange={(event) => updateVariant(index, 'weight_unit', event.target.value)}>
                                        <option value="gram">Gram</option>
                                        <option value="kg">Kg</option>
                                    </select>
                                </label>
                            </div>
                            <label>
                                <span>Gilingan</span>
                                <input value={variant.grind_size} onChange={(event) => updateVariant(index, 'grind_size', event.target.value)} required />
                            </label>
                            <label>
                                <span>Harga</span>
                                <input type="number" min="0" value={variant.price} onChange={(event) => updateVariant(index, 'price', event.target.value)} required />
                            </label>
                            <label>
                                <span>Stok</span>
                                <input type="number" min="0" value={variant.stock} onChange={(event) => updateVariant(index, 'stock', event.target.value)} required />
                            </label>
                            <button type="button" className="btn danger compact-btn" disabled={form.variants.length === 1} onClick={() => removeVariant(index)}>
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <input key={fileInputKey} type="file" accept="image/*" onChange={handleFileChange} />
            {(feedback || fileMessage || fileError) && (
                <div className={`form-alert ${fileError || feedback ? 'error' : 'success'}`}>
                    {fileError || feedback || fileMessage}
                </div>
            )}
            <button className="btn primary wide" disabled={processingImage || Boolean(fileError)}>
                {processingImage ? 'Memproses gambar...' : product ? 'Save perubahan' : 'Add produk'}
            </button>
        </form>
    );
}

export function defaultProductForm(product) {
    return {
        category_id: product?.category_id || '',
        name: product?.name || '',
        description: product?.description || '',
        roast_level: product?.roast_level || '',
        origin: product?.origin || '',
        brewing_method_ids: (product?.brewing_methods || []).map((method) => String(method.id)),
        variants: normalizeVariants(product?.variants),
    };
}

function normalizeVariants(variants = []) {
    if (!variants.length) return [emptyVariant()];

    return variants.map((variant) => {
        const grams = Number(variant.weight_grams || 0);
        const useKg = grams >= 1000 && grams % 1000 === 0;

        return {
            client_id: `variant-${variant.id}`,
            id: variant.id ? String(variant.id) : '',
            weight: useKg ? String(grams / 1000) : String(grams || ''),
            weight_unit: useKg ? 'kg' : 'gram',
            grind_size: variant.grind_size || '',
            price: variant.price || '',
            stock: variant.stock ?? '',
            sku: variant.sku || '',
        };
    });
}

function emptyVariant() {
    return {
        client_id: `variant-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        id: '',
        weight: '',
        weight_unit: 'gram',
        grind_size: '',
        price: '',
        stock: '',
        sku: '',
    };
}

async function compressImageFile(file) {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(dataUrl);
    const scale = Math.min(1, 1600 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.82, 0.72, 0.62]) {
        const blob = await canvasToBlob(canvas, quality);
        if (blob.size <= PRODUCT_IMAGE_LIMIT_BYTES || quality === 0.62) {
            return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
            });
        }
    }

    throw new Error('Compression failed.');
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
}

function canvasToBlob(canvas, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Canvas export failed.'));
            }
        }, 'image/jpeg', quality);
    });
}
