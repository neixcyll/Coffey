<?php

namespace App\Http\Controllers\Api\Seller;

use App\Http\Controllers\Controller;
use App\Models\SellerProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->seller($request),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $seller = $this->seller($request);
        $data = $request->validate([
            'store_name' => ['required', 'string', 'max:255', Rule::unique('seller_profiles', 'store_name')->ignore($seller->id)],
            'phone' => ['nullable', 'string', 'max:50'],
            'address' => ['nullable', 'string', 'max:1000'],
            'description' => ['nullable', 'string', 'max:1500'],
        ]);

        $seller->fill($data);

        if ($seller->isDirty('store_name')) {
            $seller->slug = $this->uniqueSellerSlug($data['store_name'], $seller->id);
        }

        $seller->save();

        return response()->json([
            'message' => 'Profil toko berhasil diperbarui.',
            'data' => $seller->fresh(),
        ]);
    }

    private function seller(Request $request): SellerProfile
    {
        $seller = $request->user()->sellerProfile;

        abort_if(! $seller, 403, 'Seller profile belum dibuat.');

        return $seller;
    }

    private function uniqueSellerSlug(string $storeName, int $ignoreId): string
    {
        $base = Str::slug($storeName) ?: 'seller';
        $slug = $base;
        $counter = 2;

        while (SellerProfile::where('slug', $slug)->whereKeyNot($ignoreId)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
