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
            setFileMessage('Gambar dikompresi otomatis.');
        } catch {
            setFileError('Gagal memproses gambar.');
            setFileInputKey((current) => current + 1);
        } finally {
            setProcessingImage(false);
        }
    }

    return (
        <form className="space-y-6" onSubmit={submit}>
            {/* Informasi Dasar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                    <span className="block text-sm font-semibold text-gray-700 mb-1">Kategori</span>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" value={form.category_id} onChange={(event) => update('category_id', event.target.value)} required>
                        <option value="">Pilih kategori</option>
                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                    </select>
                </label>
                <TextInput label="Nama Produk" value={form.name} onChange={(value) => update('name', value)} />
                <TextArea label="Deskripsi" value={form.description} onChange={(value) => update('description', value)} required />
                <div className="flex flex-col gap-4">
                    <TextInput label="Origin" value={form.origin} onChange={(value) => update('origin', value)} />
                    <label className="block">
                        <span className="block text-sm font-semibold text-gray-700 mb-1">Roast Level</span>
                        <select className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black outline-none" value={form.roast_level} onChange={(event) => update('roast_level', event.target.value)} required>
                            <option value="">Pilih tingkat roasting</option>
                            {ROAST_LEVEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                        </select>
                    </label>
                </div>
            </div>

            {/* Brewing Methods */}
            <div className="border-t border-gray-100 pt-5">
                <span className="block text-sm font-semibold text-gray-700 mb-2">Brewing Method</span>
                <div className="flex flex-wrap gap-2">
                    {brewingMethods.map((method) => {
                        const selected = form.brewing_method_ids.includes(String(method.id));
                        return (
                            <button
                                key={method.id}
                                type="button"
                                onClick={() => toggleBrewing(method.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${selected ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {method.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Varian */}
            <div className="border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900">Varian Produk</h3>
                    <button type="button" className="text-sm font-bold text-black hover:underline" onClick={addVariant}>+ Tambah Varian</button>
                </div>
                
                <div className="space-y-3">
                    {form.variants.map((variant, index) => (
                        <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-6 pb-3 px-3 bg-gray-50 rounded-lg items-end" key={variant.client_id}>
                            {form.variants.length > 1 && (
                                <button 
                                    type="button" 
                                    className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors" 
                                    onClick={() => removeVariant(index)}
                                    title="Hapus Varian"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                            <label className="block">
                                <span className="text-[11px] font-semibold text-gray-500 mb-1 block uppercase">Berat</span>
                                <div className="flex gap-2">
                                    <input className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-sm bg-white" type="number" min="1" value={variant.weight} onChange={(event) => updateVariant(index, 'weight', event.target.value)} required />
                                    <select className="px-2 py-1.5 rounded-md border border-gray-300 text-sm bg-white" value={variant.weight_unit} onChange={(event) => updateVariant(index, 'weight_unit', event.target.value)}>
                                        <option value="gram">g</option>
                                        <option value="kg">kg</option>
                                    </select>
                                </div>
                            </label>
                            <label className="block">
                                <span className="text-[11px] font-semibold text-gray-500 mb-1 block uppercase">Tipe Gilingan</span>
                                <input className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-sm bg-white" value={variant.grind_size} onChange={(event) => updateVariant(index, 'grind_size', event.target.value)} required />
                            </label>
                            <label className="block">
                                <span className="text-[11px] font-semibold text-gray-500 mb-1 block uppercase">Harga</span>
                                <input className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-sm bg-white" type="number" min="0" value={variant.price} onChange={(event) => updateVariant(index, 'price', event.target.value)} required />
                            </label>
                            <label className="block">
                                <span className="text-[11px] font-semibold text-gray-500 mb-1 block uppercase">Stok</span>
                                <input className="w-full px-3 py-1.5 rounded-md border border-gray-300 text-sm bg-white" type="number" min="0" value={variant.stock} onChange={(event) => updateVariant(index, 'stock', event.target.value)} required />
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gambar */}
            <div className="border-t border-gray-100 pt-5">
                <span className="block text-sm font-semibold text-gray-700 mb-2">Foto Produk</span>
                <input key={fileInputKey} type="file" accept="image/*" className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-black hover:file:bg-gray-200" onChange={handleFileChange} />
                {(feedback || fileMessage || fileError) && (
                    <div className={`mt-3 p-3 rounded-md text-xs font-medium ${fileError || feedback ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {fileError || feedback || fileMessage}
                    </div>
                )}
            </div>

            <button className="w-full py-3 bg-black text-white font-bold rounded-lg hover:bg-gray-900 transition-colors shadow-sm" disabled={processingImage || Boolean(fileError)}>
                {processingImage ? 'Memproses gambar...' : product ? 'Simpan Perubahan' : 'Tambah Produk'}
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
