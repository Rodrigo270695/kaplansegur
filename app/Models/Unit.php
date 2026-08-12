<?php

namespace App\Models;

use Database\Factories\UnitFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * Unidad operativa (sede/local) de la empresa. Se vincula con Zonales
 * mediante la tabla intermedia `unit_zones`.
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property string|null $photo
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read string|null $photo_url
 */
#[Fillable(['name', 'description', 'photo', 'is_active'])]
class Unit extends Model
{
    /** @use HasFactory<UnitFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $appends = ['photo_url'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<UnitZone, $this>
     */
    public function unitZones(): HasMany
    {
        return $this->hasMany(UnitZone::class);
    }

    /**
     * @return BelongsToMany<Zone, $this>
     */
    public function zones(): BelongsToMany
    {
        return $this->belongsToMany(Zone::class, 'unit_zones')
            ->withPivot(['id', 'is_active'])
            ->withTimestamps();
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function photoUrl(): Attribute
    {
        return Attribute::make(
            get: fn (): ?string => $this->photo !== null
                ? Storage::disk('public')->url($this->photo)
                : null,
        );
    }
}
