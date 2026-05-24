# Marketplace Kopi dengan Sistem Affiliate

Scope saat ini hanya Phase 1-3: Foundation, Core Ecommerce, Seller System, dan Midtrans Snap Sandbox. Affiliate system, wishlist, review, dashboard analitik kompleks, dark mode, dan fitur bonus lain belum dikerjakan.

## Stack

- Backend: Laravel REST API
- Frontend: React + Vite di dalam Laravel
- Database: MySQL
- Auth: Laravel Sanctum token auth
- Payment: Midtrans Snap Sandbox
- Role: admin, seller, customer

## Struktur Folder Utama

```text
app/
  Http/Controllers/Api/
    AuthController.php
    ProductController.php
    CartController.php
    CheckoutController.php
    OrderController.php
    MidtransNotificationController.php
    Admin/DashboardController.php
    Seller/DashboardController.php
    Seller/ProductController.php
    Seller/OrderController.php
  Http/Middleware/RoleMiddleware.php
  Http/Requests/
  Models/
  Services/MidtransService.php
config/
  midtrans.php
database/
  migrations/
  seeders/DatabaseSeeder.php
resources/
  js/App.jsx
  js/app.js
  css/app.css
routes/
  api.php
  web.php
```

## Setup Lokal

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
```

Atur MySQL di `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=Affiliate_Kopi
DB_USERNAME=root
DB_PASSWORD=
```

Lalu jalankan:

```bash
php artisan migrate:fresh --seed
php artisan storage:link
npm run build
php artisan serve
```

Akun seeder:

- Admin: `admin@kopi.test` / `password`
- Seller: `seller@kopi.test` / `password`
- Customer: `customer@kopi.test` / `password`

## Midtrans ENV

Isi key sandbox dari Midtrans MAP:

```env
MIDTRANS_SERVER_KEY=SB-Mid-server-...
MIDTRANS_CLIENT_KEY=SB-Mid-client-...
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_IS_SANITIZED=true
MIDTRANS_IS_3DS=true
```

Backend membuat Snap transaction token memakai Server Key. Frontend hanya memuat `snap.js` dengan Client Key dan memanggil `snap.pay(snap_token)`.

Referensi resmi:

- Snap integration guide: https://docs.midtrans.com/docs/snap-snap-integration-guide
- HTTP(S) notification/webhooks: https://docs.midtrans.com/docs/https-notification-webhooks
\
- Frontend Snap overview: https://docs.midtrans.com/reference/frontend-integration-overview

## Cara Testing Midtrans Sandbox

1. Isi `MIDTRANS_SERVER_KEY` dan `MIDTRANS_CLIENT_KEY` sandbox.
2. Jalankan aplikasi dengan URL publik untuk webhook. Untuk lokal bisa pakai ngrok:
   ```bash
   ngrok http 8000
   ```
3. Di Midtrans MAP sandbox, set Payment Notification URL ke:
   ```text
   https://domain-publik-anda/api/midtrans/notification
   ```
4. Login sebagai customer, tambah produk ke cart, lalu checkout.
5. Backend membuat order `pending`, payment `pending`, dan mengembalikan `snap_token`.
6. Frontend membuka Snap popup.
7. Setelah pembayaran sandbox diselesaikan, Midtrans POST ke webhook.
8. Webhook memverifikasi `signature_key`, mengecek status transaksi ke Midtrans, lalu:
   - `settlement` atau `capture` accepted: payment `paid`, order `paid`, stock produk dikurangi.
   - `pending`: payment tetap `pending`.
   - `expire`, `cancel`, `deny`, `failure`: payment mengikuti status dan order `cancelled`.

Webhook sengaja tidak memakai auth karena Midtrans mengirim HTTP POST dari server mereka.

## Endpoint Utama

Public:

- `POST /api/register`
- `POST /api/register/seller`
- `POST /api/login`
- `GET /api/categories`
- `GET /api/products`
- `GET /api/products/{product}`
- `POST /api/midtrans/notification`

Auth:

- `GET /api/user`
- `POST /api/logout`

Customer:

- `GET /api/cart`
- `POST /api/cart/items`
- `PUT /api/cart/items/{cartItem}`
- `DELETE /api/cart/items/{cartItem}`
- `POST /api/checkout`
- `GET /api/orders`
- `GET /api/orders/{order}`

Seller:

- `GET /api/seller/dashboard`
- `GET /api/seller/products`
- `POST /api/seller/products`
- `GET /api/seller/products/{product}`
- `PUT|PATCH|POST /api/seller/products/{product}`
- `DELETE /api/seller/products/{product}`
- `GET /api/seller/orders`
- `GET /api/seller/orders/{order}`
- `PATCH /api/seller/orders/{order}/status`
- `PATCH /api/seller/orders/{order}/items/{orderItem}/status`

Admin:

- `GET /api/admin/dashboard`

## Verifikasi

```bash
vendor/bin/pint --test
php artisan test
npm run build
```
