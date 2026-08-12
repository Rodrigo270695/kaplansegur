<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- El sistema solo soporta modo claro. --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }
        </style>

        {{-- Favicon e íconos PWA, generados a partir de /logo.png. --}}
        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-16x16.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-32x32.png">
        <link rel="icon" type="image/png" sizes="48x48" href="/icons/icon-48x48.png">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">
        <link rel="manifest" href="/manifest.webmanifest">
        <meta name="theme-color" content="#ecb500">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="apple-mobile-web-app-title" content="Kaplansegur">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
