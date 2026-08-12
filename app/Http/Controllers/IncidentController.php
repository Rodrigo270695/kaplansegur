<?php

namespace App\Http\Controllers;

use App\Exports\IncidentsExport;
use App\Http\Requests\IncidentRequest;
use App\Models\Incident;
use App\Models\Post;
use App\Models\Reason;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Incidencias.
 *
 * Cualquier usuario autenticado puede reportar incidencias. El
 * alcance de lo que ve depende del rol:
 * - Superadmin: ve todas las incidencias de todos los puestos, con
 *   columnas extra (Unidad/Zonal/Puesto) y filtro por puesto.
 * - Agente: solo ve las incidencias de su propio puesto (aunque las
 *   haya reportado otro agente del mismo puesto), con un filtro de
 *   rango de fechas que por defecto muestra solo "hoy". Solo puede
 *   editar/eliminar las que él mismo reportó (ver `IncidentPolicy`).
 */
class IncidentController extends Controller
{
    private const PER_PAGE_OPTIONS = [10, 15, 20, 25, 50, 100];

    private const SORTABLE_COLUMNS = ['occurred_at', 'created_at'];

    private const EVIDENCIA_OPTIONS = ['todos', 'con', 'sin'];

    public function index(Request $request): Response
    {
        $user = $request->user();
        $isSuperAdmin = $user->isSuperAdmin();

        $perPageRequested = (int) $request->integer('per_page', 10);
        $perPage = in_array($perPageRequested, self::PER_PAGE_OPTIONS, true)
            ? $perPageRequested
            : 10;

        $sort = (string) $request->string('sort', '');
        $direction = strtolower((string) $request->string('direction', 'desc'));
        $sortValid = in_array($sort, self::SORTABLE_COLUMNS, true);
        $directionValid = in_array($direction, ['asc', 'desc'], true);

        [$scopedQuery, $query, $filters] = $this->buildScopedQuery($request, $user, $isSuperAdmin);

        $query->with([
            'reason',
            'user.post.unitZone.unit',
            'user.post.unitZone.zone',
        ]);

        if ($sortValid) {
            $query->orderBy($sort, $directionValid ? $direction : 'asc');
        }
        $query->orderByDesc('occurred_at');

        $incidents = $query->paginate($perPage)->withQueryString();

        return Inertia::render('incidents/index', [
            'incidents' => $incidents,
            'filters' => [
                ...$filters,
                'per_page' => $perPage,
                'sort' => $sortValid ? $sort : null,
                'direction' => $sortValid && $directionValid ? $direction : null,
            ],
            'stats' => [
                'total' => (clone $scopedQuery)->count(),
                'con_evidencia' => (clone $scopedQuery)->whereNotNull('evidence')->count(),
                'hoy' => (clone $scopedQuery)->whereDate('occurred_at', now()->toDateString())->count(),
                'coincidencias' => $incidents->total(),
            ],
            'reasons_catalog' => Reason::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get(['id', 'name']),
            'posts_catalog' => $isSuperAdmin
                ? Post::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'name'])
                : [],
            'units_catalog' => $isSuperAdmin
                ? Unit::query()
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'name'])
                : [],
            'unit' => $isSuperAdmin ? null : $this->resolveAgentUnit($user),
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        $isSuperAdmin = $user->isSuperAdmin();

        [, $query] = $this->buildScopedQuery($request, $user, $isSuperAdmin);

        $incidents = $query
            ->with([
                'reason',
                'user.post.unitZone.unit',
                'user.post.unitZone.zone',
            ])
            ->orderByDesc('occurred_at')
            ->get();

        $agentPost = $user->post;
        $scopeLabel = $isSuperAdmin
            ? 'Todos los puestos'
            : ($agentPost !== null ? $agentPost->name : 'Sin puesto asignado');

        $spreadsheet = (new IncidentsExport)->build($incidents, $isSuperAdmin, $scopeLabel);
        $writer = new Xlsx($spreadsheet);

        $filename = 'incidencias-'.now()->format('Ymd-His').'.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }

    /**
     * Construye la consulta de incidencias visibles para `$user` según su
     * rol, con los filtros de búsqueda/evidencia/rango de fechas/puesto ya
     * aplicados. La usan tanto `index()` (paginada) como `export()`
     * (completa), para no duplicar la lógica de alcance ni de filtros.
     *
     * @return array{0: Builder<Incident>, 1: Builder<Incident>, 2: array{search: string, evidencia: string, desde: ?string, hasta: ?string, post_id: ?int, unit_id: ?int}}
     */
    private function buildScopedQuery(Request $request, User $user, bool $isSuperAdmin): array
    {
        $search = trim((string) $request->string('search', ''));

        $evidencia = (string) $request->string('evidencia', 'todos');
        if (! in_array($evidencia, self::EVIDENCIA_OPTIONS, true)) {
            $evidencia = 'todos';
        }

        // El filtro de rango de fechas solo se muestra en el frontend
        // para el rol agente, y siempre por defecto en "hoy".
        $today = now()->toDateString();
        $desde = $this->parseDate((string) $request->string('desde', ''));
        $hasta = $this->parseDate((string) $request->string('hasta', ''));
        if (! $isSuperAdmin && $desde === null && $hasta === null) {
            $desde = $today;
            $hasta = $today;
        }

        $postId = $isSuperAdmin ? $this->parsePostId($request) : null;
        $unitId = $isSuperAdmin ? $this->parseUnitId($request) : null;

        $scopedQuery = Incident::query();
        if (! $isSuperAdmin) {
            $this->scopeToOwnPost($scopedQuery, $user);
        }

        $query = (clone $scopedQuery)
            ->tap(fn (Builder $q) => $this->applySearch($q, $search))
            ->tap(fn (Builder $q) => $this->applyEvidencia($q, $evidencia))
            ->tap(fn (Builder $q) => $this->applyDateRange($q, $desde, $hasta))
            ->tap(fn (Builder $q) => $this->applyPost($q, $postId))
            ->tap(fn (Builder $q) => $this->applyUnit($q, $unitId));

        return [$scopedQuery, $query, [
            'search' => $search,
            'evidencia' => $evidencia,
            'desde' => $desde,
            'hasta' => $hasta,
            'post_id' => $postId,
            'unit_id' => $unitId,
        ]];
    }

    /**
     * Datos de la Unidad del puesto del agente, para mostrarlos en la
     * cabecera del listado ("Incidencias de la Unidad X" + su logo).
     *
     * @return array{name: string, photo_url: string|null}|null
     */
    private function resolveAgentUnit(User $user): ?array
    {
        $unit = $user->loadMissing('post.unitZone.unit')->post?->unitZone?->unit;

        if ($unit === null) {
            return null;
        }

        return [
            'name' => $unit->name,
            'photo_url' => $unit->photo_url,
        ];
    }

    public function store(IncidentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Incident::create([
            'reason_id' => $data['reason_id'],
            'user_id' => $request->user()?->id,
            'occurred_at' => now(),
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'detail' => $data['detail'],
            'evidence' => $this->storeEvidence($request),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Incidencia registrada correctamente.']);

        return back();
    }

    public function update(IncidentRequest $request, Incident $incident): RedirectResponse
    {
        Gate::authorize('update', $incident);

        $data = $request->validated();

        $payload = [
            'reason_id' => $data['reason_id'],
            'detail' => $data['detail'],
        ];

        if ($request->hasFile('evidence')) {
            $this->deleteEvidence($incident);
            $payload['evidence'] = $this->storeEvidence($request);
        }

        $incident->update($payload);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Incidencia actualizada correctamente.']);

        return back();
    }

    public function destroy(Incident $incident): RedirectResponse
    {
        Gate::authorize('delete', $incident);

        $this->deleteEvidence($incident);
        $incident->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Incidencia eliminada correctamente.']);

        return back();
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer'],
        ]);

        $user = $request->user();
        $incidents = Incident::whereIn('id', $data['ids'])->get();

        $deletable = $incidents->filter(fn (Incident $incident) => Gate::forUser($user)->allows('delete', $incident));
        $skipped = $incidents->count() - $deletable->count();

        $deletable->each(fn (Incident $incident) => $this->deleteEvidence($incident));
        $count = $deletable->count() > 0
            ? Incident::whereIn('id', $deletable->pluck('id'))->delete()
            : 0;

        if ($count === 0) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => 'No se eliminó ninguna incidencia: no tienes permiso sobre los registros seleccionados.',
            ]);

            return back();
        }

        $message = $count === 1
            ? '1 incidencia eliminada correctamente.'
            : "{$count} incidencias eliminadas correctamente.";

        if ($skipped > 0) {
            $message .= " ({$skipped} omitidas por no ser de tu propiedad)";
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    private function storeEvidence(Request $request): ?string
    {
        if (! $request->hasFile('evidence')) {
            return null;
        }

        return $request->file('evidence')?->store('incidents', 'public') ?: null;
    }

    private function deleteEvidence(Incident $incident): void
    {
        if ($incident->evidence !== null) {
            Storage::disk('public')->delete($incident->evidence);
        }
    }

    /**
     * Limita la consulta a las incidencias reportadas por usuarios del
     * mismo puesto que `$user`. Si el usuario no tiene puesto asignado,
     * no debe ver ninguna incidencia (evita el falso positivo de
     * `where('post_id', null)` emparejando a otros usuarios sin puesto).
     */
    /**
     * @param  Builder<Incident>  $query
     */
    private function scopeToOwnPost(Builder $query, User $user): void
    {
        $postId = $user->post_id;

        $query->whereHas('user', function (Builder $userQuery) use ($postId) {
            if ($postId === null) {
                $userQuery->whereRaw('1 = 0');
            } else {
                $userQuery->where('post_id', $postId);
            }
        });
    }

    /**
     * @param  Builder<Incident>  $query
     */
    private function applySearch(Builder $query, string $search): void
    {
        if ($search === '') {
            return;
        }

        $query->where(function (Builder $q) use ($search) {
            $q->where('detail', 'like', "%{$search}%")
                ->orWhereHas('reason', fn (Builder $r) => $r->where('name', 'like', "%{$search}%"))
                ->orWhereHas('user', fn (Builder $u) => $u->where('name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%"));
        });
    }

    /**
     * @param  Builder<Incident>  $query
     */
    private function applyEvidencia(Builder $query, string $evidencia): void
    {
        if ($evidencia === 'con') {
            $query->whereNotNull('evidence');
        } elseif ($evidencia === 'sin') {
            $query->whereNull('evidence');
        }
    }

    /**
     * @param  Builder<Incident>  $query
     */
    private function applyDateRange(Builder $query, ?string $desde, ?string $hasta): void
    {
        if ($desde !== null) {
            $query->whereDate('occurred_at', '>=', $desde);
        }

        if ($hasta !== null) {
            $query->whereDate('occurred_at', '<=', $hasta);
        }
    }

    /**
     * @param  Builder<Incident>  $query
     */
    private function applyPost(Builder $query, ?int $postId): void
    {
        if ($postId === null) {
            return;
        }

        $query->whereHas('user', fn (Builder $u) => $u->where('post_id', $postId));
    }

    /**
     * @param  Builder<Incident>  $query
     */
    private function applyUnit(Builder $query, ?int $unitId): void
    {
        if ($unitId === null) {
            return;
        }

        $query->whereHas(
            'user',
            fn (Builder $u) => $u->whereHas(
                'post',
                fn (Builder $p) => $p->whereHas(
                    'unitZone',
                    fn (Builder $uz) => $uz->where('unit_id', $unitId),
                ),
            ),
        );
    }

    private function parseDate(string $value): ?string
    {
        if ($value === '' || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return null;
        }

        return $value;
    }

    private function parsePostId(Request $request): ?int
    {
        $postId = $request->integer('post_id', 0);

        return $postId > 0 ? $postId : null;
    }

    private function parseUnitId(Request $request): ?int
    {
        $unitId = $request->integer('unit_id', 0);

        return $unitId > 0 ? $unitId : null;
    }
}
