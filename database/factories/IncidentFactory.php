<?php

namespace Database\Factories;

use App\Models\Incident;
use App\Models\Reason;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Incident>
 */
class IncidentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'reason_id' => Reason::factory(),
            'user_id' => User::factory(),
            'occurred_at' => fake()->dateTimeBetween('-30 days', 'now'),
            // Lima está aprox. entre -12/-13 lat y -77 lng.
            'latitude' => fake()->latitude(-12.3, -11.8),
            'longitude' => fake()->longitude(-77.2, -76.9),
            'detail' => fake()->paragraph(3),
            'evidence' => null,
        ];
    }
}
