<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Models\AffiliateClick;
use App\Models\Cart;
use App\Models\Order;
use App\Models\ProductVariant;
use App\Services\AffiliateService;
use App\Services\MidtransService;
use App\Services\ShippingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class CheckoutController extends Controller
{
    public function store(CheckoutRequest $request, MidtransService $midtrans, AffiliateService $affiliates, ShippingService $shipping): JsonResponse
    {
        $data = $request->validated();
        $user = $request->user();
        $affiliateProfile = $affiliates->activeProfileByCode($data['affiliate_code'] ?? null);
        $affiliateClick = isset($data['affiliate_click_id'])
            ? AffiliateClick::whereKey($data['affiliate_click_id'])->first()
            : null;

        if (! $affiliateProfile && $affiliateClick) {
            $affiliateProfile = $affiliateClick->affiliateProfile()->where('status', 'active')->first();
        }

        if ($affiliateProfile?->user_id === $user->id) {
            $affiliateProfile = null;
            $affiliateClick = null;
        }

        if ($affiliateClick && $affiliateProfile && $affiliateClick->affiliate_profile_id !== $affiliateProfile->id) {
            $affiliateClick = null;
        }

        $cart = Cart::where('user_id', $user->id)->with('items')->first();

        if (! $cart || $cart->items->isEmpty()) {
            return response()->json(['message' => 'Cart masih kosong.'], 422);
        }

        $order = DB::transaction(function () use ($cart, $data, $user, $affiliateProfile, $affiliateClick, $shipping) {
            $items = $cart->items()->get();
            $orderItems = [];
            $subtotalAmount = 0;
            $sellers = collect();

            foreach ($items as $cartItem) {
                $variant = ProductVariant::query()
                    ->with('product.seller')
                    ->whereKey($cartItem->product_variant_id)
                    ->lockForUpdate()
                    ->firstOrFail();
                $product = $variant->product;

                if ($variant->product_id !== (int) $cartItem->product_id) {
                    abort(response()->json(['message' => "Variant {$product->name} tidak valid."], 422));
                }

                if ($product->seller?->status !== 'active') {
                    abort(response()->json(['message' => "Produk {$product->name} tidak aktif."], 422));
                }

                if ($cartItem->quantity > $variant->stock) {
                    abort(response()->json(['message' => "Stock variant {$product->name} tidak mencukupi."], 422));
                }

                $subtotal = (float) $variant->price * $cartItem->quantity;
                $subtotalAmount += $subtotal;
                $sellers->push($product->seller);

                $orderItems[] = [
                    'product_id' => $product->id,
                    'product_variant_id' => $variant->id,
                    'seller_id' => $product->seller_id,
                    'product_name' => $product->name,
                    'variant_label' => $variant->label,
                    'weight_grams' => $variant->weight_grams,
                    'grind_size' => $variant->grind_size,
                    'price' => $variant->price,
                    'quantity' => $cartItem->quantity,
                    'subtotal' => $subtotal,
                    'status' => 'pending',
                ];
            }

            $originCity = $shipping->originCityForSellers($sellers);
            $shippingRate = $shipping->selectedRate((int) $data['shipping_rate_id'], $originCity, $data['destination_city']);
            $shippingCost = (float) $shippingRate->cost;
            $totalAmount = $subtotalAmount + $shippingCost;

            $order = Order::create([
                'user_id' => $user->id,
                'affiliate_profile_id' => $affiliateProfile?->id,
                'affiliate_click_id' => $affiliateClick?->id,
                'affiliate_code' => $affiliateProfile?->code,
                'order_number' => $this->makeOrderNumber(),
                'shipping_rate_id' => $shippingRate->id,
                'subtotal_amount' => $subtotalAmount,
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'shipping_address' => $data['shipping_address'],
                'courier' => $shippingRate->courier,
                'shipping_service' => $shippingRate->service,
                'shipping_cost' => $shippingCost,
                'shipping_estimated_days' => $shippingRate->estimated_days,
                'origin_city' => $originCity,
                'destination_city' => trim($data['destination_city']),
                'notes' => $data['notes'] ?? null,
            ]);

            $order->items()->createMany($orderItems);
            $order->payment()->create([
                'payment_gateway' => 'midtrans',
                'gateway_order_id' => $order->order_number,
                'amount' => $totalAmount,
                'status' => 'pending',
            ]);

            return $order->load(['items.product', 'items.productVariant', 'payment', 'user']);
        });

        try {
            $snap = $midtrans->createSnapTransaction($order);
            $order->payment->update([
                'snap_token' => $snap->token,
                'redirect_url' => $snap->redirect_url,
            ]);
            $cart->items()->delete();
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Order dibuat, tetapi Snap token gagal dibuat. Periksa konfigurasi Midtrans.',
                'error' => $exception->getMessage(),
                'order' => $order->load('payment'),
            ], 502);
        }

        return response()->json([
            'message' => 'Checkout berhasil dibuat.',
            'data' => $order->fresh()->load(['items.product', 'items.productVariant', 'payment']),
            'snap_token' => $snap->token,
            'redirect_url' => $snap->redirect_url,
            'midtrans_client_key' => $midtrans->clientKey(),
            'snap_script_url' => $midtrans->snapScriptUrl(),
        ], 201);
    }

    private function makeOrderNumber(): string
    {
        do {
            $number = 'KOPI-'.now()->format('Ymd').'-'.Str::upper(Str::random(8));
        } while (Order::where('order_number', $number)->exists());

        return $number;
    }
}
