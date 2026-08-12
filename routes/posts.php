<?php

use App\Http\Controllers\PostController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('puestos')
    ->group(function () {
        Route::get('/', [PostController::class, 'index'])->name('posts.index');
        Route::post('/', [PostController::class, 'store'])->name('posts.store');
        Route::delete('/bulk-destroy', [PostController::class, 'bulkDestroy'])->name('posts.bulk-destroy');
        Route::put('/{post}', [PostController::class, 'update'])->name('posts.update');
        Route::delete('/{post}', [PostController::class, 'destroy'])->name('posts.destroy');
    });
