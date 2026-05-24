<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Services\MidtransService;
use App\Services\PaymentStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class MidtransNotificationController extends Controller
{
    public function __invoke(Request $request, MidtransService $midtrans, PaymentStatusService $payments): JsonResponse
    {
        $payload = $request->all();

        if (! $midtrans->verifySignature($payload)) {
            return response()->json(['message' => 'Invalid Midtrans signature.'], 403);
        }

        $notification = $payload;

        try {
            $verified = $midtrans->getVerifiedNotificationStatus($payload);
            $notification = array_merge($payload, $verified);
        } catch (Throwable $exception) {
            report($exception);
        }

        $orderId = $notification['order_id'] ?? null;

        if (! $orderId) {
            return response()->json(['message' => 'order_id tidak ditemukan.'], 422);
        }

        $payment = Payment::where('gateway_order_id', $orderId)->firstOrFail();
        $payments->applyMidtransStatus($payment, $notification);

        return response()->json(['message' => 'OK']);
    }
}
