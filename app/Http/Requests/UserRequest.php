<?php

namespace App\Http\Requests;

use App\Concerns\ProfileValidationRules;
use App\Enums\Role;
use App\Models\Post;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Validación unificada para crear y editar usuarios desde el panel
 * de administración (Configuración → Usuarios).
 *
 * Reglas clave:
 *   - Reutiliza `ProfileValidationRules` (mismas reglas que el usuario
 *     usa para editar su propio perfil) para username/nombre/apellido/
 *     documento/teléfono/email.
 *   - `password` es obligatorio al crear. Al editar es opcional: si se
 *     deja en blanco, el controller conserva la contraseña actual.
 *   - `role` acepta únicamente los valores del enum `Role`.
 *   - `is_active` permite suspender una cuenta sin eliminarla.
 */
class UserRequest extends FormRequest
{
    use ProfileValidationRules;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|Closure|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User|null $user */
        $user = $this->route('user');
        $isCreate = $user === null;

        return [
            ...$this->profileRules($user?->id),
            'password' => array_filter([
                $isCreate ? 'required' : 'nullable',
                'string',
                $isCreate || filled($this->input('password')) ? Password::default() : null,
                'confirmed',
            ]),
            'role' => ['required', Rule::enum(Role::class)],
            'is_active' => ['required', 'boolean'],
            'post_id' => ['nullable', 'integer', 'exists:'.Post::class.',id'],
        ];
    }

    public function attributes(): array
    {
        return [
            'username' => 'nombre de usuario',
            'name' => 'nombre',
            'last_name' => 'apellido',
            'document_type' => 'tipo de documento',
            'document_number' => 'número de documento',
            'phone' => 'teléfono',
            'email' => 'correo electrónico',
            'password' => 'contraseña',
            'role' => 'rol',
            'is_active' => 'estado',
            'post_id' => 'puesto',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'username' => strtolower(trim((string) $this->input('username', ''))),
            'name' => trim((string) $this->input('name', '')),
            'last_name' => trim((string) $this->input('last_name', '')),
            'document_number' => trim((string) $this->input('document_number', '')),
            'phone' => trim((string) $this->input('phone', '')),
            'email' => strtolower(trim((string) $this->input('email', ''))),
            'post_id' => $this->input('post_id') ?: null,
            'is_active' => filter_var(
                $this->input('is_active', true),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE,
            ) ?? true,
        ]);
    }
}
