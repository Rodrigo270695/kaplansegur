<?php

namespace App\Http\Requests;

use App\Models\Zone;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validación para crear/editar una Unidad (sede/local).
 *
 * `zone_ids` es la lista de Zonales asignadas a la Unidad: el
 * controller sincroniza la tabla intermedia `unit_zones` a partir de
 * este arreglo, sin desvincular Zonales que ya tengan Puestos creados.
 */
class UnitRequest extends FormRequest
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
            'photo' => ['nullable', 'image', 'max:4096'],
            'is_active' => ['required', 'boolean'],
            'zone_ids' => ['nullable', 'array'],
            'zone_ids.*' => ['integer', 'distinct', 'exists:'.Zone::class.',id'],
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => 'nombre',
            'description' => 'descripción',
            'photo' => 'foto',
            'is_active' => 'estado',
            'zone_ids' => 'zonales',
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
