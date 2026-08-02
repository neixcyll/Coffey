<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class ForgotPasswordController extends Controller
{
    public function sendResetLink(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::broker('users')->sendResetLink(
            $request->only('email')
        );

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['message' => 'Jika email terdaftar, tautan reset password telah dikirim.'])
            : response()->json(['message' => 'Jika email terdaftar, tautan reset password telah dikirim.'], 200);
    }

    public function reset(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::broker('users')->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => 'Password berhasil direset. Silakan login dengan password baru.']);
        }

        return response()->json(['message' => 'Tautan reset tidak valid atau sudah kadaluarsa.'], 422);
    }
}
