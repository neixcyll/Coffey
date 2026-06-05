<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Seller\RegisterSellerRequest;
use App\Models\Role;
use App\Models\SellerProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();
        $customerRole = Role::where('name', 'customer')->firstOrFail();

        $user = User::create([
            'role_id' => $customerRole->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'status' => 'active',
        ])->load('role');

        return response()->json([
            'message' => 'Registrasi customer berhasil.',
            'token' => $user->createToken('api-token')->plainTextToken,
            'user' => $user,
        ], 201);
    }

    public function registerSeller(RegisterSellerRequest $request): JsonResponse
    {
        $data = $request->validated();
        $sellerRole = Role::where('name', 'seller')->firstOrFail();

        $user = DB::transaction(function () use ($data, $sellerRole) {
            $user = User::create([
                'role_id' => $sellerRole->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'status' => 'active',
            ]);

            SellerProfile::create([
                'user_id' => $user->id,
                'store_name' => $data['store_name'],
                'slug' => $this->uniqueSellerSlug($data['store_name']),
                'phone' => $data['phone'] ?? null,
                'address' => $data['address'] ?? null,
                'origin_city' => $data['origin_city'],
                'description' => $data['description'] ?? null,
                'status' => 'pending',
            ]);

            return $user->load(['role', 'sellerProfile']);
        });

        return response()->json([
            'message' => 'Registrasi seller berhasil.',
            'token' => $user->createToken('api-token')->plainTextToken,
            'user' => $user,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::where('email', $data['email'])->with(['role', 'sellerProfile'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Email atau password salah.'], 422);
        }

        if ($user->status === 'banned') {
            return response()->json(['message' => 'Akun ini diblokir.'], 403);
        }

        return response()->json([
            'message' => 'Login berhasil.',
            'token' => $user->createToken('api-token')->plainTextToken,
            'user' => $user,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logout berhasil.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load(['role', 'sellerProfile']),
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
        ]);

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $user->fresh()->load(['role', 'sellerProfile']),
        ]);
    }

    private function uniqueSellerSlug(string $storeName): string
    {
        $base = Str::slug($storeName);
        $slug = $base;
        $counter = 2;

        while (SellerProfile::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
