<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Throwable;

class PaymentStatusService
{
    public const PAID_ORDER_STATUSES = ['paid', 'processing', 'shipped', 'completed'];

    public function __construct(
        private readonly MidtransService $midtrans,
        private readonly AffiliateService $affiliates,
    )
    {
    }

    public function syncFromGateway(Payment $payment, ?array $snapCallbackResult = null): Payment
    {
        try {
            $status = $this->midtrans->getTransactionStatus(
                $payment->transaction_id ?: $payment->gateway_order_id,
            );
        } catch (Throwable $exception) {
            if ($snapCallbackResult) {
                $fallback = $this->applySnapCallbackResult($payment, $snapCallbackResult);

                if ($fallback) {
                    return $fallback;
                }
            }

            throw $exception;
        }

        $synced = $this->applyMidtransStatus($payment, $status);

        if ($snapCallbackResult && $synced->status !== 'paid') {
            $fallback = $this->applySnapCallbackResult($payment, $snapCallbackResult);

            if ($fallback) {
                return $fallback;
            }
        }

        return $synced;
    }

    public function applyMidtransStatus(Payment $payment, array $notification): Payment
    {
        return DB::transaction(function () use ($payment, $notification) {
            $payment = Payment::whereKey($payment->id)->lockForUpdate()->firstOrFail();
            $order = $payment->order()->with('items')->lockForUpdate()->firstOrFail();
            $transactionStatus = $notification['transaction_status'] ?? 'pending';
            $fraudStatus = $notification['fraud_status'] ?? null;
            $statusCode = (string) ($notification['status_code'] ?? '');
            $nextPaymentStatus = $this->mapPaymentStatus($transactionStatus, $fraudStatus, $statusCode);

            $payment->fill([
                'transaction_id' => $notification['transaction_id'] ?? $payment->transaction_id,
                'payment_type' => $notification['payment_type'] ?? $payment->payment_type,
                'raw_response' => $notification,
            ]);

            if ($nextPaymentStatus === 'paid') {
                $wasAlreadyPaid = $payment->status === 'paid'
                    || in_array($order->status, self::PAID_ORDER_STATUSES, true);

                $payment->status = 'paid';
                $payment->paid_at ??= now();

                if (! $wasAlreadyPaid) {
                    foreach ($order->items as $item) {
                        $product = Product::whereKey($item->product_id)->lockForUpdate()->first();

                        if ($product) {
                            $product->update([
                                'stock' => max(0, $product->stock - $item->quantity),
                            ]);
                        }
                    }
                }

                if (! in_array($order->status, ['processing', 'shipped', 'completed'], true)) {
                    $order->status = 'paid';
                }

                $this->affiliates->createCommissionsForOrder($order);
            } elseif ($nextPaymentStatus === 'pending') {
                if ($payment->status !== 'paid') {
                    $payment->status = 'pending';
                }
            } elseif (in_array($nextPaymentStatus, ['failed', 'expired', 'cancelled'], true)) {
                if ($payment->status !== 'paid') {
                    $payment->status = $nextPaymentStatus;
                    $order->status = 'cancelled';
                    $this->affiliates->cancelCommissionsForOrder($order);
                }
            } elseif ($nextPaymentStatus === 'refunded') {
                $payment->status = 'refunded';
                $this->affiliates->cancelCommissionsForOrder($order);
            }

            $payment->save();
            $order->save();

            return $payment->fresh(['order.items']);
        });
    }

    public function applySnapCallbackResult(Payment $payment, array $payload): ?Payment
    {
        $payment->loadMissing('order');

        if (($payload['order_id'] ?? null) !== $payment->gateway_order_id) {
            return null;
        }

        if (isset($payload['gross_amount']) && abs((float) $payload['gross_amount'] - (float) $payment->amount) > 0.01) {
            return null;
        }

        if (! $this->midtrans->verifySignature($payload)) {
            return null;
        }

        $nextStatus = $this->mapPaymentStatus(
            (string) ($payload['transaction_status'] ?? ''),
            isset($payload['fraud_status']) ? (string) $payload['fraud_status'] : null,
            (string) ($payload['status_code'] ?? ''),
        );

        if ($nextStatus !== 'paid') {
            return null;
        }

        return $this->applyMidtransStatus($payment, $payload);
    }

    private function mapPaymentStatus(string $transactionStatus, ?string $fraudStatus, string $statusCode): string
    {
        $transactionStatus = strtolower(trim($transactionStatus));
        $fraudStatus = $fraudStatus === null ? null : strtolower(trim($fraudStatus));
        $statusCode = trim($statusCode);

        if ($transactionStatus === 'settlement') {
            return 'paid';
        }

        if ($transactionStatus === 'capture' && ($fraudStatus === null || $fraudStatus === 'accept')) {
            return 'paid';
        }

        return match ($transactionStatus) {
            'pending' => 'pending',
            'expire' => 'expired',
            'cancel' => 'cancelled',
            'deny', 'failure' => 'failed',
            'refund', 'partial_refund' => 'refunded',
            default => $fraudStatus === 'challenge' ? 'failed' : 'pending',
        };
    }
}
