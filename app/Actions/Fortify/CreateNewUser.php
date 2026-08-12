<?php

namespace App\Actions\Fortify;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use App\Enums\Role;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Laravel\Fortify\Contracts\CreatesNewUsers;

class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules, ProfileValidationRules;

    /**
     * Validate and create a newly registered user.
     *
     * @param  array<string, string>  $input
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            ...$this->profileRules(),
            'password' => $this->passwordRules(),
        ])->validate();

        return User::create([
            'username' => $input['username'],
            'name' => $input['name'],
            'last_name' => $input['last_name'],
            'document_type' => $input['document_type'],
            'document_number' => $input['document_number'],
            'phone' => $input['phone'],
            'role' => Role::Agent,
            'email' => $input['email'],
            'password' => $input['password'],
        ]);
    }
}
