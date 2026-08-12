<?php

use App\Http\Controllers\ReasonController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('motivos')
    ->group(function () {
        Route::get('/', [ReasonController::class, 'index'])->name('reasons.index');
        Route::post('/', [ReasonController::class, 'store'])->name('reasons.store');
        Route::delete('/bulk-destroy', [ReasonController::class, 'bulkDestroy'])->name('reasons.bulk-destroy');
        Route::put('/{reason}', [ReasonController::class, 'update'])->name('reasons.update');
        Route::delete('/{reason}', [ReasonController::class, 'destroy'])->name('reasons.destroy');
    });
