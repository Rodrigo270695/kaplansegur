<?php

use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('usuarios')
    ->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('users.index');
        Route::get('/export', [UserController::class, 'export'])->name('users.export');
        Route::post('/', [UserController::class, 'store'])->name('users.store');
        Route::delete('/bulk-destroy', [UserController::class, 'bulkDestroy'])->name('users.bulk-destroy');
        Route::put('/{user}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/{user}', [UserController::class, 'destroy'])->name('users.destroy');
    });
