<?php

namespace Database\Seeders;

use App\Enums\DocumentType;
use App\Models\Incident;
use App\Models\Post;
use App\Models\Reason;
use App\Models\Unit;
use App\Models\UnitZone;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->superAdmin()->create([
            'username' => 'superadmin',
            'name' => 'Super',
            'last_name' => 'Admin',
            'document_type' => DocumentType::Dni,
            'document_number' => '00000000',
            'phone' => '999999999',
            'email' => 'admin@example.com',
        ]);

        $post = $this->seedStructure();

        $agent = User::factory()->agent()->create([
            'username' => 'agente',
            'name' => 'Test',
            'last_name' => 'Agent',
            'document_type' => DocumentType::Dni,
            'document_number' => '11111111',
            'phone' => '988888888',
            'email' => 'test@example.com',
            'post_id' => $post->id,
        ]);

        $this->seedIncidents($agent);
    }

    /**
     * Crea motivos e incidencias de ejemplo para probar el módulo
     * desde el primer arranque.
     */
    private function seedIncidents(User $agent): void
    {
        $reasons = collect([
            'Intento de robo',
            'Acceso no autorizado',
            'Persona sospechosa',
            'Objeto abandonado',
        ])->map(fn (string $name) => Reason::factory()->create(['name' => $name]));

        Incident::factory()
            ->count(5)
            ->create([
                'reason_id' => fn () => $reasons->random()->id,
                'user_id' => $agent->id,
            ]);
    }

    /**
     * Crea una estructura mínima de Unidad → Zonal → Puesto para
     * poder probar el módulo administrativo desde el primer arranque.
     */
    private function seedStructure(): Post
    {
        $unit = Unit::factory()->create(['name' => 'Unidad Lima Norte']);
        $zone = Zone::factory()->create(['name' => 'Zonal Lima']);

        $unitZone = UnitZone::factory()->create([
            'unit_id' => $unit->id,
            'zone_id' => $zone->id,
        ]);

        return Post::factory()->create([
            'unit_zone_id' => $unitZone->id,
            'name' => 'Puesto Principal',
            'address' => 'Av. Principal 123',
        ]);
    }
}
