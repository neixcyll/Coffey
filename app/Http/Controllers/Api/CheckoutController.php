<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CheckoutRequest;
use App\Models\Cart;
use App\Models\AffiliateClick;
use App\Models\Order;
use App\Models\Product;
use App\Services\AffiliateService;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

class CheckoutController extends Controller
{
    public function store(CheckoutRequest $request, MidtransService $midtrans, AffiliateService $affiliates): JsonResponse
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

        $order = DB::transaction(function () use ($cart, $data, $user, $affiliateProfile, $affiliateClick) {
            $items = $cart->items()->get();
            $orderItems = [];
            $totalAmount = 0;

            foreach ($items as $cartItem) {
                $product = Product::with('seller')->whereKey($cartItem->product_id)->lockForUpdate()->firstOrFail();

                if ($product->status !== 'active' || $product->seller?->status !== 'active') {
                    abort(response()->json(['message' => "Produk {$product->name} tidak aktif."], 422));
                }

                if ($cartItem->quantity > $product->stock) {
                    abort(response()->json(['message' => "Stock {$product->name} tidak mencukupi."], 422));
                }

                $subtotal = (float) $product->price * $cartItem->quantity;
                $totalAmount += $subtotal;

                $orderItems[] = [
                    'product_id' => $product->id,
                    'seller_id' => $product->seller_id,
                    'product_name' => $product->name,
                    'price' => $product->price,
                    'quantity' => $cartItem->quantity,
                    'subtotal' => $subtotal,
                    'status' => 'pending',
                ];
            }

            $order = Order::create([
                'user_id' => $user->id,
                'affiliate_profile_id' => $affiliateProfile?->id,
                'affiliate_click_id' => $affiliateClick?->id,
                'affiliate_code' => $affiliateProfile?->code,
                'order_number' => $this->makeOrderNumber(),
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'shipping_address' => $data['shipping_address'],
                'notes' => $data['notes'] ?? null,
            ]);

            $order->items()->createMany($orderItems);
            $order->payment()->create([
                'payment_gateway' => 'midtrans',
                'gateway_order_id' => $order->order_number,
                'amount' => $totalAmount,
                'status' => 'pending',
            ]);

            return $order->load(['items.product', 'payment', 'user']);
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
            'data' => $order->fresh()->load(['items.product', 'payment']),
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
