/**
 * Service worker mínimo, solo para que el navegador considere la app
 * "instalable" (criterio de Chrome/Edge para PWA). No cachea nada:
 * es un sistema con datos siempre autenticados/dinámicos, así que
 * cachear respuestas podría mostrar información obsoleta o de otro
 * usuario.
 */

self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});
