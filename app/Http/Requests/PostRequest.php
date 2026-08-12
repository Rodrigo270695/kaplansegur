<?php

namespace App\Http\Requests;

use App\Models\Unit;
use App\Models\UnitZone;
use App\Models\Zone;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validación para crear/editar un Puesto.
 *
 * El formulario pide Unidad + Zonal (más natural para el usuario que
 * elegir directamente un `unit_zone_id`); aquí se valida que esa
 * combinación exista realmente en la tabla intermedia `unit_zones`
 * antes de que el controller resuelva el `unit_zone_id` final.
 */
class PostRequest extends FormRequest
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
            'unit_id' => ['required', 'integer', 'exists:'.Unit::class.',id'],
            'zone_id' => ['required', 'integer', 'exists:'.Zone::class.',id', $this->zoneBelongsToUnit()],
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'unit_id' => 'unidad',
            'zone_id' => 'zonal',
            'name' => 'nombre',
            'address' => 'dirección',
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

    /**
     * La Zonal elegida debe estar realmente asignada a la Unidad
     * elegida (es decir, debe existir la fila en `unit_zones`).
     */
    protected function zoneBelongsToUnit(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            $unitId = $this->input('unit_id');

            if (! $unitId) {
                return;
            }

            $exists = UnitZone::query()
                ->where('unit_id', $unitId)
                ->where('zone_id', $value)
                ->exists();

            if (! $exists) {
                $fail('La zonal seleccionada no está asignada a esta unidad.');
            }
        };
    }

    public function resolveUnitZoneId(): int
    {
        /** @var int $unitZoneId */
        $unitZoneId = UnitZone::query()
            ->where('unit_id', $this->input('unit_id'))
            ->where('zone_id', $this->input('zone_id'))
            ->value('id');

        return $unitZoneId;
    }
}
