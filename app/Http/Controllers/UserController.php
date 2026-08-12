<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Exports\UsersExport;
use App\Http\Requests\UserRequest;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\StreamedResponse;

class UserController extends Controller
{
    /**
     * Tamaños de página permitidos en el selector del paginador.
     */
    private const PER_PAGE_OPTIONS = [10, 15, 20, 25, 50, 100];

    /**
     * Columnas por las que se puede ordenar desde el frontend.
     */
    private const SORTABLE_COLUMNS = ['name', 'username', 'email', 'created_at'];

    /**
     * Valores aceptados para el filtro `estado`.
     */
    private const ESTADO_OPTIONS = ['todos', 'activos', 'inactivos'];

    public function __construct()
    {
        Gate::authorize('manage-users');
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

        $role = (string) $request->string('role', '');
        if (Role::tryFrom($role) === null) {
            $role = '';
        }

        $query = $this->buildBaseQuery($search, $estado, $role)->with('post.unitZone.unit', 'post.unitZone.zone');

        if ($sortValid) {
            $query->orderBy($sort, $directionValid ? $direction : 'asc');
        }
        $query->orderByDesc('created_at');

        $users = $query->paginate($perPage)->withQueryString();

        return Inertia::render('users/index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'per_page' => $perPage,
                'sort' => $sortValid ? $sort : null,
                'direction' => $sortValid && $directionValid ? $direction : null,
                'estado' => $estado,
                'role' => $role !== '' ? $role : null,
            ],
            'stats' => [
                'total' => User::query()->count(),
                'activos' => User::query()->where('is_active', true)->count(),
                'inactivos' => User::query()->where('is_active', false)->count(),
                'coincidencias' => $users->total(),
            ],
            'roles_catalog' => array_map(
                fn (Role $r) => ['value' => $r->value, 'label' => $r->label()],
                Role::cases(),
            ),
            'posts_catalog' => Post::query()
                ->where('is_active', true)
                ->with('unitZone.unit', 'unitZone.zone')
                ->orderBy('name')
                ->get()
                ->map(fn (Post $post) => [
                    'id' => $post->id,
                    'name' => $post->name,
                    'unit_name' => $post->unitZone->unit->name,
                    'zone_name' => $post->unitZone->zone->name,
                ])
                ->values(),
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        $data = $request->validated();

        User::create([
            'username' => $data['username'],
            'name' => $data['name'],
            'last_name' => $data['last_name'],
            'document_type' => $data['document_type'],
            'document_number' => $data['document_number'],
            'phone' => $data['phone'],
            'role' => $data['role'],
            'is_active' => $data['is_active'],
            'post_id' => $data['post_id'] ?? null,
            'email' => $data['email'],
            'password' => $data['password'],
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Usuario creado correctamente.']);

        return back();
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        if ($request->user()?->is($user) && $request->boolean('is_active') === false) {
            throw ValidationException::withMessages([
                'is_active' => 'No puedes suspender tu propia cuenta.',
            ]);
        }

        $data = $request->validated();

        $payload = [
            'username' => $data['username'],
            'name' => $data['name'],
            'last_name' => $data['last_name'],
            'document_type' => $data['document_type'],
            'document_number' => $data['document_number'],
            'phone' => $data['phone'],
            'role' => $data['role'],
            'is_active' => $data['is_active'],
            'post_id' => $data['post_id'] ?? null,
            'email' => $data['email'],
        ];

        if (filled($data['password'] ?? null)) {
            $payload['password'] = $data['password'];
        }

        $user->update($payload);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Usuario actualizado correctamente.']);

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $blockReason = $this->undeletableReason($request, $user);

        if ($blockReason !== null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => $blockReason]);

            return back();
        }

        $user->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Usuario eliminado correctamente.']);

        return back();
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer'],
        ]);

        $currentId = $request->user()?->id;

        $deletableIds = User::query()
            ->whereIn('id', $data['ids'])
            ->where('role', '!=', Role::SuperAdmin->value)
            ->when($currentId !== null, fn (Builder $q) => $q->whereKeyNot($currentId))
            ->pluck('id');

        if ($deletableIds->isEmpty()) {
            Inertia::flash('toast', [
                'type' => 'info',
                'message' => 'No se eliminó ningún usuario: la selección solo incluía cuentas protegidas.',
            ]);

            return back();
        }

        $count = User::whereIn('id', $deletableIds)->delete();
        $skipped = count($data['ids']) - $count;

        $message = $count === 1
            ? '1 usuario eliminado correctamente.'
            : "{$count} usuarios eliminados correctamente.";

        if ($skipped > 0) {
            $message .= " ({$skipped} cuenta(s) protegida(s) se omitieron)";
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return back();
    }

    public function export(Request $request): StreamedResponse
    {
        $search = trim((string) $request->string('search', ''));

        $estado = (string) $request->string('estado', 'todos');
        if (! in_array($estado, self::ESTADO_OPTIONS, true)) {
            $estado = 'todos';
        }

        $role = (string) $request->string('role', '');
        if (Role::tryFrom($role) === null) {
            $role = '';
        }

        $users = $this->buildBaseQuery($search, $estado, $role)
            ->with('post.unitZone.unit', 'post.unitZone.zone')
            ->orderByDesc('created_at')
            ->get();

        $spreadsheet = (new UsersExport)->build($users);
        $writer = new Xlsx($spreadsheet);

        $filename = 'usuarios-'.now()->format('Ymd-His').'.xlsx';

        return response()->streamDownload(function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Cache-Control' => 'no-store, no-cache, must-revalidate',
        ]);
    }

    private function undeletableReason(Request $request, User $user): ?string
    {
        if ($request->user()?->is($user)) {
            return 'No puedes eliminar tu propia cuenta.';
        }

        if ($user->isSuperAdmin()) {
            return 'No se puede eliminar una cuenta de superadministrador.';
        }

        return null;
    }

    /**
     * @return Builder<User>
     */
    private function buildBaseQuery(string $search, string $estado, string $role): Builder
    {
        $query = User::query();

        if ($search !== '') {
            $query->where(function (Builder $q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('document_number', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($estado === 'activos') {
            $query->where('is_active', true);
        } elseif ($estado === 'inactivos') {
            $query->where('is_active', false);
        }

        if ($role !== '') {
            $query->where('role', $role);
        }

        return $query;
    }
}
