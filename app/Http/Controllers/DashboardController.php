<?php

namespace App\Http\Controllers;

use App\Models\Incident;
use App\Models\Post;
use App\Models\Unit;
use App\Models\User;
use App\Models\Zone;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Dashboard con dos vistas completamente distintas según el rol:
 * - Superadmin: panorama global de la operación (usuarios, unidades,
 *   zonales, puestos, incidencias).
 * - Agente: panorama acotado a su propio puesto y a sus propios
 *   reportes.
 */
class DashboardController extends Controller
{
    private const RECENT_LIMIT = 6;

    public function index(Request $request): Response
    {
        $user = $request->user();

        return $user->isSuperAdmin()
            ? $this->superAdminDashboard()
            : $this->agentDashboard($user);
    }

    private function superAdminDashboard(): Response
    {
        $today = now()->toDateString();

        $recentIncidents = Incident::query()
            ->with(['reason', 'user.post.unitZone.unit', 'user.post.unitZone.zone'])
            ->orderByDesc('occurred_at')
            ->limit(self::RECENT_LIMIT)
            ->get();

        $units = Unit::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'photo'])
            ->map(fn (Unit $unit) => [
                'id' => $unit->id,
                'name' => $unit->name,
                'photo_url' => $unit->photo_url,
            ]);

        return Inertia::render('dashboard', [
            'role' => 'superadmin',
            'units' => $units,
            'stats' => [
                'users' => User::query()->where('is_active', true)->count(),
                'units' => Unit::query()->where('is_active', true)->count(),
                'zones' => Zone::query()->where('is_active', true)->count(),
                'posts' => Post::query()->where('is_active', true)->count(),
                'incidents_total' => Incident::query()->count(),
                'incidents_today' => Incident::query()->whereDate('occurred_at', $today)->count(),
                'incidents_with_evidence' => Incident::query()->whereNotNull('evidence')->count(),
            ],
            'recent_incidents' => $recentIncidents,
        ]);
    }

    private function agentDashboard(User $user): Response
    {
        $today = now()->toDateString();
        $postId = $user->post_id;

        $postQuery = Incident::query()->whereHas('user', function (Builder $q) use ($postId) {
            if ($postId === null) {
                $q->whereRaw('1 = 0');
            } else {
                $q->where('post_id', $postId);
            }
        });

        $recentIncidents = (clone $postQuery)
            ->with('reason', 'user')
            ->orderByDesc('occurred_at')
            ->limit(self::RECENT_LIMIT)
            ->get();

        return Inertia::render('dashboard', [
            'role' => 'agent',
            'post_name' => $user->post?->name,
            'stats' => [
                'post_incidents_today' => (clone $postQuery)->whereDate('occurred_at', $today)->count(),
                'post_incidents_total' => (clone $postQuery)->count(),
                'my_incidents_today' => Incident::query()->where('user_id', $user->id)->whereDate('occurred_at', $today)->count(),
                'my_incidents_total' => Incident::query()->where('user_id', $user->id)->count(),
            ],
            'recent_incidents' => $recentIncidents,
        ]);
    }
}
