<?php

use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/users.php';
require __DIR__.'/units.php';
require __DIR__.'/zones.php';
require __DIR__.'/posts.php';
require __DIR__.'/reasons.php';
require __DIR__.'/incidents.php';
