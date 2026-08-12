<?php

namespace App\Http\Controllers;

use App\Http\Requests\ZoneRequest;
use App\Models\UnitZone;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ZoneController extends Controller
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

        $query = $this->buildBaseQuery($search, $estado)->with('units');

        if ($sortValid) {
            $query->orderBy($sort, $directionValid ? $direction : 'asc');
        }
        $query->orderByDesc('created_at');

        $zones = $query->paginate($perPage)->withQueryString();

        return Inertia::render('zones/index', [
            'zones' => $zones,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sortValid ? $sort : null,
                'direction' => $sortValid && $directionValid ? $direction : null,
                'estado' => $estado,
            ],
            'stats' => [
                'total' => Zone::query()->count(),
                'activos' => Zone::query()->where('is_active', true)->count(),
                'inactivos' => Zone::query()->where('is_active', false)->count(),
                'coincidencias' => $zones->total(),
            ],
        ]);
    }

    public function store(ZoneRequest $request): RedirectResponse
    {
        Zone::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Zonal creado correctamente.']);

        return back();
    }

    public function update(ZoneRequest $request, Zone $zone): RedirectResponse
    {
        $zone->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Zonal actualizado correctamente.']);

        return back();
    }

    public function destroy(Zone $zone): RedirectResponse
    {
        if ($this->hasProtectedPosts($zone)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'No se puede eliminar: el zonal tiene puestos asociados.',
            ]);

            return back();
        }

        $zone->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Zonal eliminado correctamente.']);

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
            ->whereIn('zone_id', $ids)
            ->whereHas('posts')
            ->pluck('zone_id')
            ->all();

        $deletableIds = array_values(array_diff($ids, $protectedIds));

        if ($deletableIds === []) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => 'No se eliminó ningún zonal: todos tienen puestos asociados.',
            ]);

            return back();
        }

        $count = Zone::whereIn('id', $deletableIds)->delete();
        $skipped = count($ids) - $count;

        $message = $count === 1
            ? '1 zonal eliminado correctamente.'
            : "{$count} zonales eliminados correctamente.";

        if ($skipped > 0) {
            $message .= " ({$skipped} con puestos asociados se omitieron)";
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    private function hasProtectedPosts(Zone $zone): bool
    {
        return UnitZone::query()
            ->where('zone_id', $zone->id)
            ->whereHas('posts')
            ->exists();
    }

    /**
     * @return Builder<Zone>
     */
    private function buildBaseQuery(string $search, string $estado): Builder
    {
        $query = Zone::query();

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
