<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReasonRequest;
use App\Models\Reason;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReasonController extends Controller
{
    private const PER_PAGE_OPTIONS = [10, 15, 20, 25, 50, 100];

    private const SORTABLE_COLUMNS = ['name', 'created_at'];

    private const ESTADO_OPTIONS = ['todos', 'activos', 'inactivos'];

    public function __construct()
    {
        Gate::authorize('manage-reasons');
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

        $query = $this->buildBaseQuery($search, $estado);

        if ($sortValid) {
            $query->orderBy($sort, $directionValid ? $direction : 'asc');
        }
        $query->orderByDesc('created_at');

        $reasons = $query->paginate($perPage)->withQueryString();

        return Inertia::render('reasons/index', [
            'reasons' => $reasons,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sortValid ? $sort : null,
                'direction' => $sortValid && $directionValid ? $direction : null,
                'estado' => $estado,
            ],
            'stats' => [
                'total' => Reason::query()->count(),
                'activos' => Reason::query()->where('is_active', true)->count(),
                'inactivos' => Reason::query()->where('is_active', false)->count(),
                'coincidencias' => $reasons->total(),
            ],
        ]);
    }

    public function store(ReasonRequest $request): RedirectResponse
    {
        Reason::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Motivo creado correctamente.']);

        return back();
    }

    public function update(ReasonRequest $request, Reason $reason): RedirectResponse
    {
        $reason->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Motivo actualizado correctamente.']);

        return back();
    }

    public function destroy(Reason $reason): RedirectResponse
    {
        if ($reason->incidents()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'No se puede eliminar: el motivo tiene incidencias asociadas.',
            ]);

            return back();
        }

        $reason->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Motivo eliminado correctamente.']);

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

        $protectedIds = Reason::query()
            ->whereIn('id', $ids)
            ->whereHas('incidents')
            ->pluck('id')
            ->all();

        $deletableIds = array_values(array_diff($ids, $protectedIds));

        if ($deletableIds === []) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => 'No se eliminó ningún motivo: todos tienen incidencias asociadas.',
            ]);

            return back();
        }

        $count = Reason::whereIn('id', $deletableIds)->delete();
        $skipped = count($ids) - $count;

        $message = $count === 1
            ? '1 motivo eliminado correctamente.'
            : "{$count} motivos eliminados correctamente.";

        if ($skipped > 0) {
            $message .= " ({$skipped} con incidencias asociadas se omitieron)";
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    /**
     * @return Builder<Reason>
     */
    private function buildBaseQuery(string $search, string $estado): Builder
    {
        $query = Reason::query();

        if ($search !== '') {
            $query->where('name', 'like', "%{$search}%");
        }

        if ($estado === 'activos') {
            $query->where('is_active', true);
        } elseif ($estado === 'inactivos') {
            $query->where('is_active', false);
        }

        return $query;
    }
}
