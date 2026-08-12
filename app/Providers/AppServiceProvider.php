<?php

namespace App\Providers;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureGates();
    }

    /**
     * Define application-wide authorization gates.
     */
    protected function configureGates(): void
    {
        Gate::define('manage-users', fn (User $user): bool => $user->isSuperAdmin());
        Gate::define('manage-structure', fn (User $user): bool => $user->isSuperAdmin());
        // El catálogo de Motivos solo lo administra el superadmin. Las
        // Incidencias en sí las puede crear/ver cualquier usuario
        // autenticado (ver IncidentController e IncidentPolicy para el
        // alcance por puesto y la autorización de editar/eliminar).
        Gate::define('manage-reasons', fn (User $user): bool => $user->isSuperAdmin());
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
