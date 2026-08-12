<?php

namespace Database\Factories;

use App\Models\Reason;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reason>
 */
class ReasonFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement([
                'Intento de robo',
                'Acceso no autorizado',
                'Falla de cámaras',
                'Persona sospechosa',
                'Objeto abandonado',
                'Emergencia médica',
                'Conflicto entre personas',
                'Daño a la propiedad',
            ]),
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
