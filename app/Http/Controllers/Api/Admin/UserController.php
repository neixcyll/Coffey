<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->with(['role', 'sellerProfile'])
            ->when($request->filled('role'), function ($query) use ($request) {
                $query->whereHas('role', fn ($query) => $query->where('name', $request->string('role')->toString()));
            })
            ->when($request->filled('status'), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return response()->json($users);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'data' => $user->load([
                'role',
                'sellerProfile.products.category',
                'sellerProfile.products.images',
                'sellerProfile.products.variants',
                'sellerProfile.products.brewingMethods',
                'cart.items.product',
                'cart.items.productVariant',
            ])->loadCount('cart'),
        ]);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', Rule::in(['active', 'banned'])],
            'role' => ['sometimes', Rule::in(['admin', 'seller', 'customer'])],
        ]);

        if (($data['status'] ?? null) === 'banned' && $request->user()->is($user)) {
            return response()->json(['message' => 'Admin tidak bisa membanned akun sendiri.'], 422);
        }

        if (isset($data['role'])) {
            $user->role_id = Role::where('name', $data['role'])->firstOrFail()->id;
        }

        if (isset($data['status'])) {
            $user->status = $data['status'];
        }

        $user->save();

        return response()->json([
            'message' => 'User berhasil diperbarui.',
            'data' => $user->fresh()->load(['role', 'sellerProfile']),
        ]);
    }
}
