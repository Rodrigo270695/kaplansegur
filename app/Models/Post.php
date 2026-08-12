<?php

namespace App\Models;

use Database\Factories\PostFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Puesto de vigilancia. Pertenece a una combinación Unidad+Zonal
 * concreta (`unit_zone_id`) y puede tener muchos usuarios asignados.
 *
 * @property int $id
 * @property int $unit_zone_id
 * @property string $name
 * @property string|null $address
 * @property string|null $description
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read UnitZone $unitZone
 */
#[Fillable(['unit_zone_id', 'name', 'address', 'description', 'is_active'])]
class Post extends Model
{
    /** @use HasFactory<PostFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<UnitZone, $this>
     */
    public function unitZone(): BelongsTo
    {
        return $this->belongsTo(UnitZone::class);
    }

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
