/**
 * Tipos del módulo Unidades (Estructura → Unidades).
 */

/** Zonal resumido, tal como viaja embebido en cada Unidad. */
export type UnitZoneOption = {
    id: number;
    name: string;
    is_active: boolean;
};

export type Unit = {
    id: number;
    name: string;
    description: string | null;
    photo: string | null;
    photo_url: string | null;
    is_active: boolean;
    /** Zonales asignadas a esta unidad (relación muchos a muchos). */
    zones?: UnitZoneOption[];
    created_at: string;
    updated_at: string;
};

export type UnitStats = {
    total: number;
    activos: number;
    inactivos: number;
    coincidencias: number;
};

export type UnitEstadoFilter = 'todos' | 'activos' | 'inactivos';

export type UnitFilters = {
    search: string;
    per_page: number;
    sort: string | null;
    direction: 'asc' | 'desc' | null;
    estado: UnitEstadoFilter;
};

/** Catálogo de zonales disponibles para asignar a una unidad. */
export type ZoneOption = {
    id: number;
    name: string;
    is_active: boolean;
};
