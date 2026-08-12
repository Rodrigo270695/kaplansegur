<?php

namespace App\Models;

use Database\Factories\UnitZoneFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Tabla de vinculación (muchos a muchos) entre Unidad y Zonal.
 *
 * Se modela como una entidad propia (y no como un simple pivote de
 * `belongsToMany`) porque cada combinación Unidad+Zonal puede tener
 * sus propios Puestos colgando de ella (`posts.unit_zone_id`).
 *
 * @property int $id
 * @property int $unit_id
 * @property int $zone_id
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Unit $unit
 * @property-read Zone $zone
 */
#[Fillable(['unit_id', 'zone_id', 'is_active'])]
class UnitZone extends Model
{
    /** @use HasFactory<UnitZoneFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Unit, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * @return BelongsTo<Zone, $this>
     */
    public function zone(): BelongsTo
    {
        return $this->belongsTo(Zone::class);
    }

    /**
     * @return HasMany<Post, $this>
     */
    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }
}
