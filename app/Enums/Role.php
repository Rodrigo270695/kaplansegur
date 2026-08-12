<?php

namespace App\Enums;

enum Role: string
{
    case SuperAdmin = 'superadmin';
    case Agent = 'agent';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Superadministrador',
            self::Agent => 'Agente',
        };
    }
}
