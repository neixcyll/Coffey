<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\StoreCartItemRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cart = $this->cartFor($request)->load(['items.product.category', 'items.product.seller', 'items.productVariant']);

        return response()->json($this->cartPayload($cart));
    }

    public function store(StoreCartItemRequest $request): JsonResponse
    {
        $data = $request->validated();
        $variant = ProductVariant::query()
            ->with('product.seller')
            ->whereKey($data['product_variant_id'])
            ->firstOrFail();
        $product = $variant->product;

        if ($variant->product_id !== (int) $data['product_id']) {
            return response()->json(['message' => 'Variant tidak sesuai dengan produk.'], 422);
        }

        if ($product->seller?->status !== 'active') {
            return response()->json(['message' => 'Produk tidak aktif dan tidak bisa dibeli.'], 422);
        }

        $cart = $this->cartFor($request);
        $item = $cart->items()->firstOrNew([
            'product_id' => $product->id,
            'product_variant_id' => $variant->id,
        ]);
        $newQuantity = ($item->exists ? $item->quantity : 0) + $data['quantity'];

        if ($newQuantity > $variant->stock) {
            return response()->json(['message' => 'Quantity melebihi stock variant produk.'], 422);
        }

        $item->quantity = $newQuantity;
        $item->save();

        return response()->json($this->cartPayload($cart->fresh()->load(['items.product.category', 'items.product.seller', 'items.productVariant'])), 201);
    }

    public function update(UpdateCartItemRequest $request, CartItem $cartItem): JsonResponse
    {
        $cart = $this->cartFor($request);

        abort_if($cartItem->cart_id !== $cart->id, 404);

        $cartItem->loadMissing(['product.seller', 'productVariant']);
        $product = $cartItem->product;
        $variant = $cartItem->productVariant;
        $quantity = $request->validated()['quantity'];

        if (! $variant || $product->seller?->status !== 'active') {
            return response()->json(['message' => 'Produk tidak aktif dan tidak bisa dibeli.'], 422);
        }

        if ($quantity > $variant->stock) {
            return response()->json(['message' => 'Quantity melebihi stock variant produk.'], 422);
        }

        $cartItem->update(['quantity' => $quantity]);

        return response()->json($this->cartPayload($cart->fresh()->load(['items.product.category', 'items.product.seller', 'items.productVariant'])));
    }

    public function destroy(Request $request, CartItem $cartItem): JsonResponse
    {
        $cart = $this->cartFor($request);

        abort_if($cartItem->cart_id !== $cart->id, 404);

        $cartItem->delete();

        return response()->json($this->cartPayload($cart->fresh()->load(['items.product.category', 'items.product.seller', 'items.productVariant'])));
    }

    private function cartFor(Request $request): Cart
    {
        return Cart::firstOrCreate(['user_id' => $request->user()->id]);
    }

    private function cartPayload(Cart $cart): array
    {
        $items = $cart->items
            ->filter(fn (CartItem $item) => $item->product && $item->productVariant)
            ->map(function (CartItem $item) {
                $subtotal = (float) $item->productVariant->price * $item->quantity;

                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_variant_id' => $item->product_variant_id,
                    'quantity' => $item->quantity,
                    'subtotal' => $subtotal,
                    'product' => $item->product,
                    'variant' => $item->productVariant,
                ];
            })->values();

        return [
            'data' => [
                'id' => $cart->id,
                'items' => $items,
                'total_amount' => $items->sum('subtotal'),
            ],
        ];
    }
}
