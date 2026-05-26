<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductReviewController extends Controller
{
    public function index(string $product): JsonResponse
    {
        $product = $this->productFromRoute($product);

        $reviews = ProductReview::query()
            ->where('product_id', $product->id)
            ->where('status', 'published')
            ->with([
                'user:id,name',
                'seller:id,store_name,slug',
                'order:id,order_number',
            ])
            ->latest()
            ->get();

        return response()->json([
            'data' => $reviews,
            'meta' => [
                'avg_rating' => $product->avg_rating,
                'reviews_count' => $product->reviews_count,
            ],
        ]);
    }

    public function eligibility(Request $request, string $product): JsonResponse
    {
        $this->authorizeCustomer($request);

        $product = $this->productFromRoute($product);
        $orders = Order::query()
            ->where('user_id', $request->user()->id)
            ->where('status', 'completed')
            ->whereHas('items', function ($query) use ($product) {
                $query->where('product_id', $product->id)
                    ->where('status', 'completed');
            })
            ->with(['items' => function ($query) use ($product) {
                $query->where('product_id', $product->id)
                    ->where('status', 'completed');
            }])
            ->latest()
            ->get();

        $reviewedOrderIds = ProductReview::query()
            ->where('product_id', $product->id)
            ->where('user_id', $request->user()->id)
            ->whereIn('order_id', $orders->pluck('id'))
            ->pluck('order_id')
            ->all();

        $eligibleOrders = $orders
            ->reject(fn (Order $order) => in_array($order->id, $reviewedOrderIds, true))
            ->map(fn (Order $order) => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'created_at' => $order->created_at,
                'completed_at' => $order->updated_at,
                'quantity' => $order->items->sum('quantity'),
            ])
            ->values();

        return response()->json([
            'data' => [
                'can_review' => $eligibleOrders->isNotEmpty(),
                'eligible_orders' => $eligibleOrders,
                'reviewed_order_ids' => $reviewedOrderIds,
            ],
        ]);
    }

    public function store(Request $request, string $product): JsonResponse
    {
        $this->authorizeCustomer($request);

        $product = $this->productFromRoute($product);
        $data = $request->validate([
            'order_id' => ['required', Rule::exists('orders', 'id')],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['required', 'string', 'min:10'],
            'images' => ['nullable', 'array', 'max:5'],
            'images.*' => ['image', 'max:2048'],
        ]);

        $order = Order::query()
            ->whereKey($data['order_id'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        if ($order->status !== 'completed') {
            return response()->json(['message' => 'Review hanya bisa dibuat setelah order completed.'], 422);
        }

        $orderItem = OrderItem::query()
            ->where('order_id', $order->id)
            ->where('product_id', $product->id)
            ->where('status', 'completed')
            ->first();

        if (! $orderItem) {
            return response()->json(['message' => 'Produk ini tidak ditemukan pada order completed milik customer.'], 422);
        }

        $alreadyReviewed = ProductReview::query()
            ->where('order_id', $order->id)
            ->where('product_id', $product->id)
            ->where('user_id', $request->user()->id)
            ->exists();

        if ($alreadyReviewed) {
            return response()->json(['message' => 'Produk ini sudah direview untuk order tersebut.'], 422);
        }

        $imagePaths = collect($request->file('images', []))
            ->map(fn ($image) => $image->store('reviews', 'public'))
            ->values()
            ->all();

        $review = ProductReview::create([
            'product_id' => $product->id,
            'order_id' => $order->id,
            'user_id' => $request->user()->id,
            'seller_id' => $orderItem->seller_id,
            'rating' => $data['rating'],
            'comment' => $data['comment'],
            'images' => $imagePaths ?: null,
            'status' => 'published',
        ]);

        return response()->json([
            'message' => 'Review produk berhasil dikirim.',
            'data' => $review->load([
                'user:id,name',
                'seller:id,store_name,slug',
                'order:id,order_number',
            ]),
        ], 201);
    }

    private function productFromRoute(string $product): Product
    {
        $product = Product::query()
            ->withAvg(['reviews as avg_rating' => fn ($query) => $query->where('status', 'published')], 'rating')
            ->withCount(['reviews as reviews_count' => fn ($query) => $query->where('status', 'published')])
            ->where(function ($query) use ($product) {
                $query->where('slug', $product);

                if (ctype_digit($product)) {
                    $query->orWhereKey((int) $product);
                }
            })
            ->firstOrFail();

        abort_if($product->status !== 'active', 404);
        abort_if($product->seller?->status !== 'active', 404);

        return $product;
    }

    private function authorizeCustomer(Request $request): void
    {
        $user = $request->user()->loadMissing('role');

        abort_unless($user->hasRole('customer'), 403, 'Login sebagai customer untuk mengirim review.');
    }
}
