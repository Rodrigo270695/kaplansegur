<?php

use App\Http\Controllers\ZoneController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('zonales')
    ->group(function () {
        Route::get('/', [ZoneController::class, 'index'])->name('zones.index');
        Route::post('/', [ZoneController::class, 'store'])->name('zones.store');
        Route::delete('/bulk-destroy', [ZoneController::class, 'bulkDestroy'])->name('zones.bulk-destroy');
        Route::put('/{zone}', [ZoneController::class, 'update'])->name('zones.update');
        Route::delete('/{zone}', [ZoneController::class, 'destroy'])->name('zones.destroy');
    });
