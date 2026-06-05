<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'shipping_address' => ['required', 'string', 'max:2000'],
            'destination_city' => ['required', 'string', 'max:255'],
            'shipping_rate_id' => ['required', 'integer', 'exists:shipping_rates,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'affiliate_code' => ['nullable', 'string', 'max:30'],
            'affiliate_click_id' => ['nullable', 'integer', 'exists:affiliate_clicks,id'],
        ];
    }
}
