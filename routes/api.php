<?php

use App\Http\Controllers\Api\AffiliateController;
use App\Http\Controllers\Api\Admin\AffiliateCommissionController as AdminAffiliateCommissionController;
use App\Http\Controllers\Api\Admin\AffiliateController as AdminAffiliateController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Api\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Api\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Api\Admin\SellerController as AdminSellerController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\MidtransNotificationController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\Seller\DashboardController as SellerDashboardController;
use App\Http\Controllers\Api\Seller\OrderController as SellerOrderController;
use App\Http\Controllers\Api\Seller\ProductController as SellerProductController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/register/seller', [AuthController::class, 'registerSeller']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/categories', [ProductController::class, 'categories']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{product}', [ProductController::class, 'show']);
Route::post('/affiliate/clicks', [AffiliateController::class, 'trackClick']);

Route::post('/midtrans/notification', MidtransNotificationController::class);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::patch('/user', [AuthController::class, 'updateProfile']);

    Route::middleware('role:customer')->group(function () {
        Route::get('/cart', [CartController::class, 'index']);
        Route::post('/cart/items', [CartController::class, 'store']);
        Route::put('/cart/items/{cartItem}', [CartController::class, 'update']);
        Route::delete('/cart/items/{cartItem}', [CartController::class, 'destroy']);

        Route::post('/checkout', [CheckoutController::class, 'store']);
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);
        Route::post('/orders/{order}/sync-payment', [OrderController::class, 'syncPayment']);

        Route::get('/affiliate/dashboard', [AffiliateController::class, 'dashboard']);
        Route::post('/affiliate/register', [AffiliateController::class, 'register']);
        Route::get('/affiliate/commissions', [AffiliateController::class, 'commissions']);
        Route::get('/affiliate/clicks', [AffiliateController::class, 'clicks']);
    });

    Route::prefix('seller')->middleware('role:seller')->group(function () {
        Route::get('/dashboard', SellerDashboardController::class);
        Route::get('/products', [SellerProductController::class, 'index']);
        Route::post('/products', [SellerProductController::class, 'store']);
        Route::get('/products/{product}', [SellerProductController::class, 'show']);
        Route::match(['put', 'patch', 'post'], '/products/{product}', [SellerProductController::class, 'update']);
        Route::delete('/products/{product}', [SellerProductController::class, 'destroy']);

        Route::get('/notifications', [SellerOrderController::class, 'notifications']);
        Route::get('/orders', [SellerOrderController::class, 'index']);
        Route::get('/orders/{order}', [SellerOrderController::class, 'show']);
        Route::patch('/orders/{order}/status', [SellerOrderController::class, 'updateOrderStatus']);
        Route::patch('/orders/{order}/items/{orderItem}/status', [SellerOrderController::class, 'updateItemStatus']);
    });

    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('/dashboard', AdminDashboardController::class);
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{user}', [AdminUserController::class, 'show']);
        Route::patch('/users/{user}', [AdminUserController::class, 'update']);

        Route::get('/sellers', [AdminSellerController::class, 'index']);
        Route::get('/sellers/{seller}', [AdminSellerController::class, 'show']);
        Route::patch('/sellers/{seller}/status', [AdminSellerController::class, 'updateStatus']);
        Route::post('/sellers/{seller}/approve', [AdminSellerController::class, 'approve']);
        Route::post('/sellers/{seller}/reject', [AdminSellerController::class, 'reject']);
        Route::post('/sellers/{seller}/suspend', [AdminSellerController::class, 'suspend']);

        Route::apiResource('categories', AdminCategoryController::class)->except(['create', 'edit']);

        Route::get('/products', [AdminProductController::class, 'index']);
        Route::get('/products/{product}', [AdminProductController::class, 'show']);
        Route::patch('/products/{product}/status', [AdminProductController::class, 'updateStatus']);

        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::get('/orders/{order}', [AdminOrderController::class, 'show']);

        Route::get('/payments', [AdminPaymentController::class, 'index']);
        Route::get('/payments/{payment}', [AdminPaymentController::class, 'show']);

        Route::get('/reports', AdminReportController::class);

        Route::get('/affiliates', [AdminAffiliateController::class, 'index']);
        Route::get('/affiliates/{affiliate}', [AdminAffiliateController::class, 'show']);
        Route::patch('/affiliates/{affiliate}', [AdminAffiliateController::class, 'update']);

        Route::get('/affiliate-commissions', [AdminAffiliateCommissionController::class, 'index']);
        Route::get('/affiliate-commissions/{commission}', [AdminAffiliateCommissionController::class, 'show']);
        Route::patch('/affiliate-commissions/{commission}', [AdminAffiliateCommissionController::class, 'update']);
    });
});
