/**
 * Utilidades de formateo de fecha/hora en español (es-PE).
 *
 * `Intl.DateTimeFormat` puede usar un espacio distinto entre la hora y el
 * indicador "a. m./p. m." (espacio normal, NBSP o espacio angosto U+202F)
 * según la versión de ICU del motor. Node (SSR) y el navegador (hidratación)
 * a veces no coinciden en ese carácter aunque el texto se vea idéntico, lo
 * que provoca un error de hidratación de React. Normalizamos todos los
 * espacios a uno solo para que el HTML del servidor y el del cliente sean
 * siempre exactamente iguales.
 */
const normalizeSpaces = (value: string): string => value.replace(/\s+/g, ' ');

export const formatDate = (iso: string): string =>
    normalizeSpaces(
        new Date(iso).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }),
    );

export const formatDateTime = (iso: string): string =>
    normalizeSpaces(
        new Date(iso).toLocaleString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }),
    );
