<?php

namespace App\Http\Requests;

use App\Models\Reason;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Validación para crear/editar una Incidencia.
 *
 * `occurred_at`, `latitude`, `longitude` y `user_id` los fija el
 * controller automáticamente (no viajan en el formulario): la fecha/
 * hora la pone el servidor (zona horaria America/Lima) y el GPS lo
 * captura el navegador solo al crear el registro.
 */
class IncidentRequest extends FormRequest
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
            'reason_id' => ['required', 'integer', 'exists:'.Reason::class.',id'],
            'detail' => ['required', 'string', 'max:5000'],
            'evidence' => ['nullable', 'file', 'max:20480', 'mimes:jpg,jpeg,png,pdf,mp4,mov,avi,webm'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }

    public function attributes(): array
    {
        return [
            'reason_id' => 'motivo',
            'detail' => 'detalle',
            'evidence' => 'evidencia',
            'latitude' => 'latitud',
            'longitude' => 'longitud',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'detail' => trim((string) $this->input('detail', '')),
        ]);
    }
}
