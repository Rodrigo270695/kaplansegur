<?php

namespace App\Http\Controllers;

use App\Http\Requests\UnitRequest;
use App\Models\Unit;
use App\Models\UnitZone;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    private const PER_PAGE_OPTIONS = [10, 15, 20, 25, 50, 100];

    private const SORTABLE_COLUMNS = ['name', 'created_at'];

    private const ESTADO_OPTIONS = ['todos', 'activos', 'inactivos'];

    public function __construct()
    {
        Gate::authorize('manage-structure');
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search', ''));
        $perPageRequested = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPageRequested, self::PER_PAGE_OPTIONS, true)
            ? $perPageRequested
            : 10;

        $sort = (string) $request->string('sort', '');
        $direction = strtolower((string) $request->string('direction', 'desc'));
        $sortValid = in_array($sort, self::SORTABLE_COLUMNS, true);
        $directionValid = in_array($direction, ['asc', 'desc'], true);

        $estado = (string) $request->string('estado', 'todos');
        if (! in_array($estado, self::ESTADO_OPTIONS, true)) {
            $estado = 'todos';
        }

        $query = $this->buildBaseQuery($search, $estado)->with('zones');

        if ($sortValid) {
            $query->orderBy($sort, $directionValid ? $direction : 'asc');
        }
        $query->orderByDesc('created_at');

        $units = $query->paginate($perPage)->withQueryString();

        return Inertia::render('units/index', [
            'units' => $units,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sortValid ? $sort : null,
                'direction' => $sortValid && $directionValid ? $direction : null,
                'estado' => $estado,
            ],
            'stats' => [
                'total' => Unit::query()->count(),
                'activos' => Unit::query()->where('is_active', true)->count(),
                'inactivos' => Unit::query()->where('is_active', false)->count(),
                'coincidencias' => $units->total(),
            ],
            'zones_catalog' => Zone::query()
                ->orderBy('name')
                ->get(['id', 'name', 'is_active']),
        ]);
    }

    public function store(UnitRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $unit = Unit::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'photo' => $this->storePhoto($request),
            'is_active' => $data['is_active'],
        ]);

        $unit->zones()->sync($data['zone_ids'] ?? []);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Unidad creada correctamente.']);

        return back();
    }

    public function update(UnitRequest $request, Unit $unit): RedirectResponse
    {
        $data = $request->validated();

        $payload = [
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'],
        ];

        if ($request->hasFile('photo')) {
            $this->deletePhoto($unit);
            $payload['photo'] = $this->storePhoto($request);
        }

        $unit->update($payload);

        $this->syncZonesProtectingPosts($unit, $data['zone_ids'] ?? []);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Unidad actualizada correctamente.']);

        return back();
    }

    public function destroy(Unit $unit): RedirectResponse
    {
        if ($this->hasProtectedPosts($unit)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'No se puede eliminar: la unidad tiene puestos asociados.',
            ]);

            return back();
        }

        $this->deletePhoto($unit);
        $unit->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Unidad eliminada correctamente.']);

        return back();
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer'],
        ]);

        /** @var array<int, int> $ids */
        $ids = $data['ids'];

        $protectedIds = UnitZone::query()
            ->whereIn('unit_id', $ids)
            ->whereHas('posts')
            ->pluck('unit_id')
            ->all();

        $deletableIds = array_values(array_diff($ids, $protectedIds));

        if ($deletableIds === []) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => 'No se eliminó ninguna unidad: todas tienen puestos asociados.',
            ]);

            return back();
        }

        $units = Unit::whereIn('id', $deletableIds)->get();
        $units->each(fn (Unit $unit) => $this->deletePhoto($unit));

        $count = Unit::whereIn('id', $deletableIds)->delete();
        $skipped = count($ids) - $count;

        $message = $count === 1
            ? '1 unidad eliminada correctamente.'
            : "{$count} unidades eliminadas correctamente.";

        if ($skipped > 0) {
            $message .= " ({$skipped} con puestos asociados se omitieron)";
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    private function hasProtectedPosts(Unit $unit): bool
    {
        return UnitZone::query()
            ->where('unit_id', $unit->id)
            ->whereHas('posts')
            ->exists();
    }

    /**
     * Sincroniza las zonales asignadas a la unidad sin desvincular
     * ninguna combinación Unidad+Zonal que ya tenga Puestos creados.
     *
     * @param  array<int, int>  $desiredZoneIds
     */
    private function syncZonesProtectingPosts(Unit $unit, array $desiredZoneIds): void
    {
        $currentZoneIds = $unit->zones()->pluck('zones.id')->all();

        $protectedZoneIds = UnitZone::query()
            ->where('unit_id', $unit->id)
            ->whereHas('posts')
            ->pluck('zone_id')
            ->all();

        $finalZoneIds = array_unique([
            ...array_intersect($currentZoneIds, $protectedZoneIds),
            ...$desiredZoneIds,
        ]);

        $unit->zones()->sync($finalZoneIds);
    }

    private function storePhoto(Request $request): ?string
    {
        if (! $request->hasFile('photo')) {
            return null;
        }

        return $request->file('photo')?->store('units', 'public') ?: null;
    }

    private function deletePhoto(Unit $unit): void
    {
        if ($unit->photo !== null) {
            Storage::disk('public')->delete($unit->photo);
        }
    }

    /**
     * @return Builder<Unit>
     */
    private function buildBaseQuery(string $search, string $estado): Builder
    {
        $query = Unit::query();

        if ($search !== '') {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($estado === 'activos') {
            $query->where('is_active', true);
        } elseif ($estado === 'inactivos') {
            $query->where('is_active', false);
        }

        return $query;
    }
}
