import type { UserPost } from '@/types/auth';

/**
 * Tipos del módulo Incidencias.
 *
 * `occurred_at`, `latitude` y `longitude` los fija el sistema al
 * crear el registro (fecha/hora en zona horaria America/Lima y GPS
 * capturado por el navegador); no son editables desde el formulario.
 *
 * El alcance de lo que se ve/edita depende del rol (ver
 * `IncidentController` e `IncidentPolicy` en el backend): un agente
 * solo ve/gestiona incidencias de su propio puesto y solo puede
 * editar/eliminar las que él mismo reportó; el superadmin ve y
 * gestiona todo.
 */

export type IncidentReason = {
    id: number;
    name: string;
};

export type IncidentReporter = {
    id: number;
    name: string;
    last_name: string;
    post?: UserPost | null;
};

export type Incident = {
    id: number;
    reason_id: number;
    user_id: number | null;
    occurred_at: string;
    latitude: string | null;
    longitude: string | null;
    detail: string;
    evidence: string | null;
    evidence_url: string | null;
    reason?: IncidentReason;
    user?: IncidentReporter | null;
    created_at: string;
    updated_at: string;
};

export type IncidentStats = {
    total: number;
    con_evidencia: number;
    hoy: number;
    coincidencias: number;
};

export type IncidentEvidenciaFilter = 'todos' | 'con' | 'sin';

export type IncidentFilters = {
    search: string;
    per_page: number;
    sort: string | null;
    direction: 'asc' | 'desc' | null;
    evidencia: IncidentEvidenciaFilter;
    /** Rango de fechas (YYYY-MM-DD). Solo lo usa el frontend para agentes. */
    desde: string | null;
    hasta: string | null;
    /** Filtro por puesto, solo disponible para superadmin. */
    post_id: number | null;
    /** Filtro por unidad, solo disponible para superadmin. */
    unit_id: number | null;
};

/** Catálogo de motivos activos, para el select del formulario. */
export type ReasonCatalogEntry = {
    id: number;
    name: string;
};

/** Catálogo de puestos activos, para el filtro de superadmin. */
export type PostCatalogEntry = {
    id: number;
    name: string;
};

/** Catálogo de unidades activas, para el filtro de superadmin. */
export type UnitCatalogEntry = {
    id: number;
    name: string;
};

/**
 * Unidad del puesto del agente autenticado, para personalizar la
 * cabecera ("Incidencias de la Unidad X" + su logo). Es `null` para
 * superadmin (ve todas las unidades) o si el agente no tiene puesto
 * asignado.
 */
export type IncidentAgentUnit = {
    name: string;
    photo_url: string | null;
};
