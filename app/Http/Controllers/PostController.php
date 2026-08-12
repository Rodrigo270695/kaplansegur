<?php

namespace App\Http\Controllers;

use App\Http\Requests\PostRequest;
use App\Models\Post;
use App\Models\Unit;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PostController extends Controller
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

        $unitId = $this->parseId($request, 'unit_id');
        $zoneId = $this->parseId($request, 'zone_id');

        $query = $this->buildBaseQuery($search, $estado, $unitId, $zoneId)
            ->with('unitZone.unit', 'unitZone.zone');

        if ($sortValid) {
            $query->orderBy($sort, $directionValid ? $direction : 'asc');
        }
        $query->orderByDesc('created_at');

        $posts = $query->paginate($perPage)->withQueryString();

        return Inertia::render('posts/index', [
            'posts' => $posts,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sortValid ? $sort : null,
                'direction' => $sortValid && $directionValid ? $direction : null,
                'estado' => $estado,
                'unit_id' => $unitId,
                'zone_id' => $zoneId,
            ],
            'stats' => [
                'total' => Post::query()->count(),
                'activos' => Post::query()->where('is_active', true)->count(),
                'inactivos' => Post::query()->where('is_active', false)->count(),
                'coincidencias' => $posts->total(),
            ],
            'units_catalog' => $this->buildUnitsCatalog(),
            'zones_catalog' => Zone::query()
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(PostRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Post::create([
            'unit_zone_id' => $request->resolveUnitZoneId(),
            'name' => $data['name'],
            'address' => $data['address'] ?? null,
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Puesto creado correctamente.']);

        return back();
    }

    public function update(PostRequest $request, Post $post): RedirectResponse
    {
        $data = $request->validated();

        $post->update([
            'unit_zone_id' => $request->resolveUnitZoneId(),
            'name' => $data['name'],
            'address' => $data['address'] ?? null,
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Puesto actualizado correctamente.']);

        return back();
    }

    public function destroy(Post $post): RedirectResponse
    {
        if ($post->users()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'No se puede eliminar: el puesto tiene usuarios asignados.',
            ]);

            return back();
        }

        $post->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Puesto eliminado correctamente.']);

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

        $protectedIds = Post::query()
            ->whereIn('id', $ids)
            ->whereHas('users')
            ->pluck('id')
            ->all();

        $deletableIds = array_values(array_diff($ids, $protectedIds));

        if ($deletableIds === []) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => 'No se eliminó ningún puesto: todos tienen usuarios asignados.',
            ]);

            return back();
        }

        $count = Post::whereIn('id', $deletableIds)->delete();
        $skipped = count($ids) - $count;

        $message = $count === 1
            ? '1 puesto eliminado correctamente.'
            : "{$count} puestos eliminados correctamente.";

        if ($skipped > 0) {
            $message .= " ({$skipped} con usuarios asignados se omitieron)";
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    /**
     * Catálogo de Unidades con sus Zonales asignadas, para el select
     * en cascada Unidad → Zonal del formulario de Puesto.
     *
     * @return array<int, array{id: int, name: string, zones: array<int, array{id: int, name: string}>}>
     */
    private function buildUnitsCatalog(): array
    {
        return Unit::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->with(['zones' => fn ($q) => $q->where('zones.is_active', true)->orderBy('zones.name')])
            ->get()
            ->map(fn (Unit $unit) => [
                'id' => $unit->id,
                'name' => $unit->name,
                'zones' => $unit->zones->map(fn ($zone) => [
                    'id' => $zone->id,
                    'name' => $zone->name,
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * @return Builder<Post>
     */
    private function buildBaseQuery(string $search, string $estado, ?int $unitId, ?int $zoneId): Builder
    {
        $query = Post::query();

        if ($search !== '') {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($estado === 'activos') {
            $query->where('is_active', true);
        } elseif ($estado === 'inactivos') {
            $query->where('is_active', false);
        }

        if ($unitId !== null) {
            $query->whereHas('unitZone', fn (Builder $q) => $q->where('unit_id', $unitId));
        }

        if ($zoneId !== null) {
            $query->whereHas('unitZone', fn (Builder $q) => $q->where('zone_id', $zoneId));
        }

        return $query;
    }

    private function parseId(Request $request, string $key): ?int
    {
        $value = $request->integer($key, 0);

        return $value > 0 ? $value : null;
    }
}
