<?php

namespace App\Http\Requests;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validación para crear/editar un Zonal.
 */
class ZoneRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|Closure|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nombre',
            'description' => 'descripción',
            'is_active' => 'estado',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->input('name', '')),
            'is_active' => filter_var(
                $this->input('is_active', true),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE,
            ) ?? true,
        ]);
    }
}
