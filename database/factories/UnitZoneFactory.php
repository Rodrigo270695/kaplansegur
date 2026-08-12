<?php

namespace Database\Factories;

use App\Models\Unit;
use App\Models\UnitZone;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UnitZone>
 */
class UnitZoneFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'unit_id' => Unit::factory(),
            'zone_id' => Zone::factory(),
            'is_active' => true,
        ];
    }
}
