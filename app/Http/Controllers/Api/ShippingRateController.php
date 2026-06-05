<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Services\ShippingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingRateController extends Controller
{
    public function index(Request $request, ShippingService $shipping): JsonResponse
    {
        $data = $request->validate([
            'destination_city' => ['required', 'string', 'max:255'],
        ]);

        $cart = Cart::query()
            ->where('user_id', $request->user()->id)
            ->with('items.product.seller')
            ->first();

        if (! $cart || $cart->items->isEmpty()) {
            return response()->json(['message' => 'Cart masih kosong.'], 422);
        }

        $originCity = $shipping->originCityForCart($cart);
        $rates = $shipping->ratesFor($originCity, $data['destination_city']);

        return response()->json([
            'message' => $rates->isEmpty() ? 'Ongkir untuk kota tujuan ini belum tersedia.' : 'Pilihan ongkir tersedia.',
            'data' => [
                'origin_city' => $originCity,
                'destination_city' => trim($data['destination_city']),
                'rates' => $rates,
            ],
        ]);
    }
}
