/**
 * Tipos del módulo Motivos (Incidencias → Motivos).
 */

export type Reason = {
    id: number;
    name: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type ReasonStats = {
    total: number;
    activos: number;
    inactivos: number;
    coincidencias: number;
};

export type ReasonEstadoFilter = 'todos' | 'activos' | 'inactivos';

export type ReasonFilters = {
    search: string;
    per_page: number;
    sort: string | null;
    direction: 'asc' | 'desc' | null;
    estado: ReasonEstadoFilter;
};

/** Catálogo de motivos activos, para el select del formulario de incidencias. */
export type ReasonOption = {
    id: number;
    name: string;
};
