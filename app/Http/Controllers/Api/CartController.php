<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\StoreCartItemRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cart = $this->cartFor($request)->load(['items.product.category', 'items.product.seller']);

        return response()->json($this->cartPayload($cart));
    }

    public function store(StoreCartItemRequest $request): JsonResponse
    {
        $data = $request->validated();
        $product = Product::with('seller')->findOrFail($data['product_id']);

        if ($product->status !== 'active' || $product->seller?->status !== 'active') {
            return response()->json(['message' => 'Produk tidak aktif dan tidak bisa dibeli.'], 422);
        }

        $cart = $this->cartFor($request);
        $item = $cart->items()->firstOrNew(['product_id' => $product->id]);
        $newQuantity = ($item->exists ? $item->quantity : 0) + $data['quantity'];

        if ($newQuantity > $product->stock) {
            return response()->json(['message' => 'Quantity melebihi stock produk.'], 422);
        }

        $item->quantity = $newQuantity;
        $item->save();

        return response()->json($this->cartPayload($cart->fresh()->load(['items.product.category', 'items.product.seller'])), 201);
    }

    public function update(UpdateCartItemRequest $request, CartItem $cartItem): JsonResponse
    {
        $cart = $this->cartFor($request);

        abort_if($cartItem->cart_id !== $cart->id, 404);

        $product = $cartItem->product;
        $quantity = $request->validated()['quantity'];

        if ($product->status !== 'active' || $product->seller?->status !== 'active') {
            return response()->json(['message' => 'Produk tidak aktif dan tidak bisa dibeli.'], 422);
        }

        if ($quantity > $product->stock) {
            return response()->json(['message' => 'Quantity melebihi stock produk.'], 422);
        }

        $cartItem->update(['quantity' => $quantity]);

        return response()->json($this->cartPayload($cart->fresh()->load(['items.product.category', 'items.product.seller'])));
    }

    public function destroy(Request $request, CartItem $cartItem): JsonResponse
    {
        $cart = $this->cartFor($request);

        abort_if($cartItem->cart_id !== $cart->id, 404);

        $cartItem->delete();

        return response()->json($this->cartPayload($cart->fresh()->load(['items.product.category', 'items.product.seller'])));
    }

    private function cartFor(Request $request): Cart
    {
        return Cart::firstOrCreate(['user_id' => $request->user()->id]);
    }

    private function cartPayload(Cart $cart): array
    {
        $items = $cart->items->map(function (CartItem $item) {
            $subtotal = (float) $item->product->price * $item->quantity;

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'subtotal' => $subtotal,
                'product' => $item->product,
            ];
        });

        return [
            'data' => [
                'id' => $cart->id,
                'items' => $items,
                'total_amount' => $items->sum('subtotal'),
            ],
        ];
    }
}
