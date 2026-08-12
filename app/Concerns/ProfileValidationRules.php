<?php

namespace App\Concerns;

use App\Enums\DocumentType;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, ValidationRule|Closure|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null): array
    {
        return [
            'username' => $this->usernameRules($userId),
            'name' => $this->nameRules(),
            'last_name' => $this->lastNameRules(),
            'document_type' => $this->documentTypeRules(),
            'document_number' => $this->documentNumberRules($userId),
            'phone' => $this->phoneRules(),
            'email' => $this->emailRules($userId),
        ];
    }

    /**
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function usernameRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'alpha_dash',
            'min:3',
            'max:50',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }

    /**
     * Get the validation rules used to validate user names.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function nameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function lastNameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function documentTypeRules(): array
    {
        return ['required', Rule::enum(DocumentType::class)];
    }

    /**
     * @return array<int, ValidationRule|Closure|array<mixed>|string>
     */
    protected function documentNumberRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'max:30',
            $this->onlyDigitsForDniAndRuc(),
            Rule::unique(User::class, 'document_number')
                ->where(fn ($query) => $query->where(
                    'document_type',
                    request()->input('document_type'),
                ))
                ->ignore($userId),
        ];
    }

    /**
     * DNI y RUC (Perú) son siempre numéricos; CE y pasaporte pueden
     * incluir letras.
     */
    protected function onlyDigitsForDniAndRuc(): Closure
    {
        return function (string $attribute, mixed $value, Closure $fail): void {
            $documentType = request()->input('document_type');

            $requiresDigitsOnly = in_array($documentType, [
                DocumentType::Dni->value,
                DocumentType::Ruc->value,
            ], true);

            if ($requiresDigitsOnly && ! ctype_digit((string) $value)) {
                $fail('El número de documento debe contener solo números para DNI y RUC.');
            }
        };
    }

    /**
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function phoneRules(): array
    {
        return ['required', 'string', 'max:20'];
    }

    /**
     * Get the validation rules used to validate user emails.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }
}
