<?php

use App\Http\Controllers\UnitController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('unidades')
    ->group(function () {
        Route::get('/', [UnitController::class, 'index'])->name('units.index');
        Route::post('/', [UnitController::class, 'store'])->name('units.store');
        Route::delete('/bulk-destroy', [UnitController::class, 'bulkDestroy'])->name('units.bulk-destroy');
        Route::put('/{unit}', [UnitController::class, 'update'])->name('units.update');
        Route::delete('/{unit}', [UnitController::class, 'destroy'])->name('units.destroy');
    });
