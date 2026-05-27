<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sellerId = $this->user()?->sellerProfile?->id;
        $product = $this->route('product');

        return [
            'category_id' => ['sometimes', 'exists:categories,id'],
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('products', 'name')
                    ->where(fn ($query) => $query->where('seller_id', $sellerId))
                    ->ignore($product?->id),
            ],
            'description' => ['sometimes', 'string'],
            'roast_level' => ['sometimes', 'string', 'max:100'],
            'origin' => ['sometimes', 'string', 'max:150'],
            'brewing_methods' => ['nullable', 'array'],
            'brewing_methods.*' => ['integer', 'exists:brewing_methods,id'],
            'variants' => ['sometimes', 'array', 'min:1'],
            'variants.*.id' => ['nullable', 'integer', 'exists:product_variants,id'],
            'variants.*.weight_grams' => ['required_with:variants', 'integer', 'min:1'],
            'variants.*.grind_size' => ['required_with:variants', 'string', 'max:100'],
            'variants.*.price' => ['required_with:variants', 'numeric', 'min:0'],
            'variants.*.stock' => ['required_with:variants', 'integer', 'min:0'],
            'variants.*.sku' => ['nullable', 'string', 'max:100'],
            'image' => ['nullable', 'image', 'max:2048'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['image', 'max:2048'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'Produk dengan nama tersebut sudah ada.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $this->validateUniqueVariantCombinations($validator);
            $this->validateVariantOwnership($validator);
        });
    }

    private function validateUniqueVariantCombinations(Validator $validator): void
    {
        $seen = [];

        foreach ((array) $this->input('variants', []) as $index => $variant) {
            $weight = (int) ($variant['weight_grams'] ?? 0);
            $grindSize = Str::lower(trim((string) ($variant['grind_size'] ?? '')));

            if ($weight <= 0 || $grindSize === '') {
                continue;
            }

            $key = "{$weight}|{$grindSize}";

            if (isset($seen[$key])) {
                $validator->errors()->add("variants.{$index}.grind_size", 'Kombinasi berat dan grind size tidak boleh duplikat.');
            }

            $seen[$key] = true;
        }
    }

    private function validateVariantOwnership(Validator $validator): void
    {
        $product = $this->route('product');

        if (! $product || ! $this->has('variants')) {
            return;
        }

        $ownedVariantIds = $product->variants()->pluck('id')->map(fn ($id) => (int) $id)->all();

        foreach ((array) $this->input('variants', []) as $index => $variant) {
            $variantId = (int) ($variant['id'] ?? 0);

            if ($variantId > 0 && ! in_array($variantId, $ownedVariantIds, true)) {
                $validator->errors()->add("variants.{$index}.id", 'Variant tidak ditemukan pada produk ini.');
            }
        }
    }
}
