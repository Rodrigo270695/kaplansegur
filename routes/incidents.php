<?php

use App\Http\Controllers\IncidentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('incidencias')
    ->group(function () {
        Route::get('/', [IncidentController::class, 'index'])->name('incidents.index');
        Route::get('/export', [IncidentController::class, 'export'])->name('incidents.export');
        Route::post('/', [IncidentController::class, 'store'])->name('incidents.store');
        Route::delete('/bulk-destroy', [IncidentController::class, 'bulkDestroy'])->name('incidents.bulk-destroy');
        Route::put('/{incident}', [IncidentController::class, 'update'])->name('incidents.update');
        Route::delete('/{incident}', [IncidentController::class, 'destroy'])->name('incidents.destroy');
    });
