<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Arr;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Transaction;
use RuntimeException;

class MidtransService
{
    public function __construct()
    {
        Config::$serverKey = (string) config('midtrans.server_key');
        Config::$clientKey = (string) config('midtrans.client_key');
        Config::$isProduction = (bool) config('midtrans.is_production');
        Config::$isSanitized = (bool) config('midtrans.is_sanitized');
        Config::$is3ds = (bool) config('midtrans.is_3ds');

        $caCertPath = config('midtrans.ca_cert_path');

        if ($caCertPath && file_exists($caCertPath)) {
            Config::$curlOptions = [
                CURLOPT_CAINFO => $caCertPath,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_HTTPHEADER => [],
            ];
        }
    }

    public function createSnapTransaction(Order $order): object
    {
        if (! Config::$serverKey) {
            throw new RuntimeException('MIDTRANS_SERVER_KEY belum diisi.');
        }

        $order->loadMissing(['items.product', 'user']);

        $params = [
            'transaction_details' => [
                'order_id' => $order->order_number,
                'gross_amount' => (int) round((float) $order->total_amount),
            ],
            'customer_details' => [
                'first_name' => $order->customer_name,
                'email' => $order->user->email,
                'phone' => $order->customer_phone,
                'shipping_address' => [
                    'first_name' => $order->customer_name,
                    'phone' => $order->customer_phone,
                    'address' => $order->shipping_address,
                ],
            ],
            'item_details' => $order->items->map(fn ($item) => [
                'id' => (string) $item->product_id,
                'price' => (int) round((float) $item->price),
                'quantity' => $item->quantity,
                'name' => mb_substr($item->product_name, 0, 50),
            ])->values()->all(),
        ];

        return Snap::createTransaction($params);
    }

    public function verifySignature(array $payload): bool
    {
        $serverKey = Config::$serverKey;

        if (! $serverKey || ! isset($payload['signature_key'])) {
            return false;
        }

        $signaturePayload = ($payload['order_id'] ?? '')
            .($payload['status_code'] ?? '')
            .($payload['gross_amount'] ?? '')
            .$serverKey;

        return hash_equals(hash('sha512', $signaturePayload), (string) $payload['signature_key']);
    }

    public function getVerifiedNotificationStatus(array $payload): array
    {
        if (! Config::$serverKey) {
            throw new RuntimeException('MIDTRANS_SERVER_KEY belum diisi.');
        }

        $transactionId = Arr::get($payload, 'transaction_id') ?: Arr::get($payload, 'order_id');

        if (! $transactionId) {
            throw new RuntimeException('Payload notification tidak memiliki transaction_id atau order_id.');
        }

        return json_decode(json_encode(Transaction::status($transactionId)), true);
    }

    public function getTransactionStatus(string $transactionIdOrOrderId): array
    {
        if (! Config::$serverKey) {
            throw new RuntimeException('MIDTRANS_SERVER_KEY belum diisi.');
        }

        return json_decode(json_encode(Transaction::status($transactionIdOrOrderId)), true);
    }

    public function clientKey(): ?string
    {
        return config('midtrans.client_key');
    }

    public function snapScriptUrl(): string
    {
        return config('midtrans.is_production')
            ? 'https://app.midtrans.com/snap/snap.js'
            : 'https://app.sandbox.midtrans.com/snap/snap.js';
    }
}
