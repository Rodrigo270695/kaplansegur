/**
 * Tipos del módulo Zonales (Estructura → Zonales).
 */

/** Unidad resumida, tal como viaja embebida en cada Zonal. */
export type ZoneUnit = {
    id: number;
    name: string;
};

export type Zone = {
    id: number;
    name: string;
    description: string | null;
    is_active: boolean;
    /** Unidades asignadas a este zonal (relación muchos a muchos). */
    units?: ZoneUnit[];
    created_at: string;
    updated_at: string;
};

export type ZoneStats = {
    total: number;
    activos: number;
    inactivos: number;
    coincidencias: number;
};

export type ZoneEstadoFilter = 'todos' | 'activos' | 'inactivos';

export type ZoneFilters = {
    search: string;
    per_page: number;
    sort: string | null;
    direction: 'asc' | 'desc' | null;
    estado: ZoneEstadoFilter;
};
