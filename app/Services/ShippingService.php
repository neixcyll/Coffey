<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\ShippingRate;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ShippingService
{
    public function originCityForCart(Cart $cart): string
    {
        $cart->loadMissing('items.product.seller');

        return $this->originCityForSellers(
            $cart->items->map(fn ($item) => $item->product?->seller)->filter(),
        );
    }

    public function originCityForSellers(Collection $sellers): string
    {
        $sellerIds = $sellers->pluck('id')->unique();

        if ($sellerIds->count() !== 1) {
            throw ValidationException::withMessages([
                'cart' => 'Checkout ongkir sederhana hanya mendukung produk dari satu toko dalam satu order.',
            ]);
        }

        $originCity = trim((string) $sellers->first()?->origin_city);

        if ($originCity === '') {
            throw ValidationException::withMessages([
                'cart' => 'Kota asal seller belum diatur. Hubungi seller sebelum checkout.',
            ]);
        }

        return $originCity;
    }

    public function ratesFor(string $originCity, string $destinationCity): Collection
    {
        return ShippingRate::query()
            ->whereRaw('LOWER(origin_city) = ?', [$this->normalize($originCity)])
            ->whereRaw('LOWER(destination_city) = ?', [$this->normalize($destinationCity)])
            ->orderBy('cost')
            ->orderBy('courier')
            ->get();
    }

    public function selectedRate(int $rateId, string $originCity, string $destinationCity): ShippingRate
    {
        $rate = ShippingRate::query()
            ->whereKey($rateId)
            ->whereRaw('LOWER(origin_city) = ?', [$this->normalize($originCity)])
            ->whereRaw('LOWER(destination_city) = ?', [$this->normalize($destinationCity)])
            ->first();

        if (! $rate) {
            throw ValidationException::withMessages([
                'shipping_rate_id' => 'Pilihan ongkir tidak valid untuk kota tujuan ini.',
            ]);
        }

        return $rate;
    }

    private function normalize(string $city): string
    {
        return Str::lower(trim($city));
    }
}
