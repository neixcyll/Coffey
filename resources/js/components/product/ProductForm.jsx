import { useEffect, useState } from 'react';
import { BREWING_OPTIONS, ROAST_LEVEL_OPTIONS } from '../../constants/options.js';
import { PRODUCT_STATUSES } from '../../constants/statuses.js';
import TextArea from '../common/TextArea.jsx';
import TextInput from '../common/TextInput.jsx';

const PRODUCT_IMAGE_LIMIT_BYTES = 1.8 * 1024 * 1024;

export default function ProductForm({ categories, product, onSubmit, feedback }) {
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

    function submit(event) {
        event.preventDefault();
        if (processingImage || fileError) return;

        const payload = new FormData();
        Object.entries(form).forEach(([key, value]) => {
            if (key === 'weight_unit') return;
            if (key === 'weight') {
                const grams = form.weight_unit === 'kg'
                    ? Math.round(Number(value || 0) * 1000)
                    : Number(value || 0);
                payload.append('weight', grams);
                return;
            }
            payload.append(key, value);
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

    const hasCustomBrewing = form.brewing_method && !BREWING_OPTIONS.some((option) => option.value === form.brewing_method);

    return (
        <form className="panel form-grid" onSubmit={submit}>
            <h2>{product ? 'Edit produk' : 'Tambah produk'}</h2>
            <select value={form.category_id} onChange={(event) => update('category_id', event.target.value)} required>
                <option value="">Pilih kategori</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
            <TextInput label="Nama" value={form.name} onChange={(value) => update('name', value)} />
            <TextArea label="Deskripsi" value={form.description} onChange={(value) => update('description', value)} required />
            <div className="grid-2">
                <TextInput label="Harga" type="number" value={form.price} onChange={(value) => update('price', value)} />
                <TextInput label="Stock" type="number" value={form.stock} onChange={(value) => update('stock', value)} />
                <div className="unit-row">
                    <TextInput label="Berat" type="number" value={form.weight} onChange={(value) => update('weight', value)} />
                    <label>
                        <span>Satuan</span>
                        <select value={form.weight_unit} onChange={(event) => update('weight_unit', event.target.value)}>
                            <option value="gram">Gram</option>
                            <option value="kg">Kg</option>
                        </select>
                    </label>
                </div>
                <label>
                    <span>Roast level</span>
                    <select value={form.roast_level} onChange={(event) => update('roast_level', event.target.value)} required>
                        <option value="">Pilih roast level</option>
                        {ROAST_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
                <TextInput label="Origin" value={form.origin} onChange={(value) => update('origin', value)} />
                <label>
                    <span>Brewing</span>
                    <select value={form.brewing_method} onChange={(event) => update('brewing_method', event.target.value)}>
                        <option value="">Pilih brewing</option>
                        {hasCustomBrewing && <option value={form.brewing_method}>{form.brewing_method}</option>}
                        {BREWING_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                </label>
            </div>
            <select value={form.status} onChange={(event) => update('status', event.target.value)}>
                {PRODUCT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <input key={fileInputKey} type="file" accept="image/*" onChange={handleFileChange} />
            {(feedback || fileMessage || fileError) && (
                <div className={`form-alert ${fileError || feedback ? 'error' : 'success'}`}>
                    {fileError || feedback || fileMessage}
                </div>
            )}
            <button className="btn primary wide" disabled={processingImage || Boolean(fileError)}>
                {processingImage ? 'Memproses gambar...' : product ? 'Simpan perubahan' : 'Tambah produk'}
            </button>
        </form>
    );
}

export function defaultProductForm(product) {
    return {
        category_id: product?.category_id || '',
        name: product?.name || '',
        description: product?.description || '',
        price: product?.price || '',
        stock: product?.stock || '',
        weight: product?.weight >= 1000 ? Number(product.weight) / 1000 : product?.weight || '',
        weight_unit: product?.weight >= 1000 ? 'kg' : 'gram',
        roast_level: product?.roast_level || '',
        origin: product?.origin || '',
        brewing_method: product?.brewing_method || '',
        status: product?.status || 'active',
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
