<?php

namespace App\Models;

use Database\Factories\IncidentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * Incidencia reportada por un usuario. La fecha/hora (`occurred_at`) y
 * la ubicación (`latitude`/`longitude`) las fija el sistema al crear
 * el registro (no son editables desde el formulario): `occurred_at`
 * usa la zona horaria de la app (America/Lima) y el GPS se captura en
 * el navegador al momento de reportar.
 *
 * @property int $id
 * @property int $reason_id
 * @property int|null $user_id
 * @property Carbon $occurred_at
 * @property string|null $latitude
 * @property string|null $longitude
 * @property string $detail
 * @property string|null $evidence
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Reason $reason
 * @property-read User|null $user
 * @property-read string|null $evidence_url
 */
#[Fillable(['reason_id', 'user_id', 'occurred_at', 'latitude', 'longitude', 'detail', 'evidence'])]
class Incident extends Model
{
    /** @use HasFactory<IncidentFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $appends = ['evidence_url'];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
        ];
    }

    /**
     * @return BelongsTo<Reason, $this>
     */
    public function reason(): BelongsTo
    {
        return $this->belongsTo(Reason::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return Attribute<string|null, never>
     */
    protected function evidenceUrl(): Attribute
    {
        return Attribute::make(
            get: fn (): ?string => $this->evidence !== null
                ? Storage::disk('public')->url($this->evidence)
                : null,
        );
    }
}
