<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class CreatorProfile extends Model
{
    protected $fillable = [
        'user_id',
        'username',
        'display_name',
        'bio',
        'avatar',
        'website_url',
        'social_links',
        'status',
    ];

    protected $appends = [
        'avatar_url',
    ];

    protected function casts(): array
    {
        return [
            'social_links' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getAvatarUrlAttribute(): ?string
    {
        if (! $this->avatar) {
            return null;
        }

        if (str_starts_with($this->avatar, 'http')) {
            return $this->avatar;
        }

        return Storage::url($this->avatar);
    }
}
