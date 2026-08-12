<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\UnitZone;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'unit_zone_id' => UnitZone::factory(),
            'name' => 'Puesto '.fake()->unique()->buildingNumber(),
            'address' => fake()->address(),
            'description' => fake()->sentence(8),
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
