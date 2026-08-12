<?php

namespace App\Enums;

enum DocumentType: string
{
    case Dni = 'dni';
    case Ce = 'ce';
    case Passport = 'passport';
    case Ruc = 'ruc';

    public function label(): string
    {
        return match ($this) {
            self::Dni => 'DNI',
            self::Ce => 'Carné de Extranjería',
            self::Passport => 'Pasaporte',
            self::Ruc => 'RUC',
        };
    }
}
