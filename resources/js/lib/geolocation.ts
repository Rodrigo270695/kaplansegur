/**
 * Caché ligero de la última ubicación conocida del navegador.
 *
 * El permiso de geolocalización se solicita apenas se inicia sesión
 * (ver `app-sidebar-layout.tsx`), no cuando se abre el formulario de
 * "Nueva incidencia". Guardamos el resultado aquí para que, si el
 * agente crea una incidencia poco después de entrar, el formulario
 * pueda usar esa ubicación al instante en vez de esperar una nueva
 * captura (que además volvería a mostrar el permiso si aún no se
 * había resuelto).
 */

export type CachedCoordinates = {
    latitude: number;
    longitude: number;
    capturedAt: number;
};

const STORAGE_KEY = 'kaplansegur:last-known-location';
const DEFAULT_MAX_AGE_MS = 10 * 60 * 1000;

let memoryCache: CachedCoordinates | null = null;

const readSessionCache = (): CachedCoordinates | null => {
    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);

        return raw ? (JSON.parse(raw) as CachedCoordinates) : null;
    } catch {
        return null;
    }
};

const writeSessionCache = (coords: CachedCoordinates): void => {
    try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
    } catch {
        // Almacenamiento no disponible (modo privado, etc.): el caché en
        // memoria sigue funcionando durante la sesión de la pestaña.
    }
};

/**
 * Última ubicación capturada, si sigue "fresca" (por defecto, últimos
 * 10 minutos). `null` si no hay ninguna o ya venció.
 */
export const getCachedCoordinates = (
    maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): CachedCoordinates | null => {
    const cached = memoryCache ?? readSessionCache();

    if (!cached || Date.now() - cached.capturedAt > maxAgeMs) {
        return null;
    }

    return cached;
};

/**
 * Solicita la ubicación al navegador. Si el permiso todavía no se
 * decidió, esto es lo que dispara el diálogo del navegador. Es
 * silenciosa a propósito: solo actualiza el caché, no informa éxito
 * ni error a quien la llama (para eso, cada consumidor puede volver a
 * pedir su propia ubicación si necesita reaccionar al resultado).
 */
export const requestGeolocation = (): void => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const coords: CachedCoordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                capturedAt: Date.now(),
            };

            memoryCache = coords;
            writeSessionCache(coords);
        },
        () => {
            // Silencioso: si se rechaza, el formulario sigue funcionando
            // sin ubicación.
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
};
