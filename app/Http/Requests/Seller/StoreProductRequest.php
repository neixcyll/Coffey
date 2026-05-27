<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $sellerId = $this->user()?->sellerProfile?->id;

        return [
            'category_id' => ['required', 'exists:categories,id'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('products', 'name')->where(fn ($query) => $query->where('seller_id', $sellerId)),
            ],
            'description' => ['required', 'string'],
            'roast_level' => ['required', 'string', 'max:100'],
            'origin' => ['required', 'string', 'max:150'],
            'brewing_methods' => ['nullable', 'array'],
            'brewing_methods.*' => ['integer', 'exists:brewing_methods,id'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.weight_grams' => ['required', 'integer', 'min:1'],
            'variants.*.grind_size' => ['required', 'string', 'max:100'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.stock' => ['required', 'integer', 'min:0'],
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
}
