<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingRate extends Model
{
    protected $fillable = [
        'origin_city',
        'destination_city',
        'courier',
        'service',
        'cost',
        'estimated_days',
    ];

    protected function casts(): array
    {
        return [
            'cost' => 'decimal:2',
        ];
    }
}
