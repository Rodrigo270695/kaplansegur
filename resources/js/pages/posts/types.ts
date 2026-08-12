/**
 * Tipos del módulo Puestos (Estructura → Puestos).
 *
 * Un Puesto pertenece a una combinación concreta Unidad+Zonal
 * (`unit_zone`), por eso el listado y el formulario trabajan con
 * `unit_id` + `zone_id` en vez de exponer el `unit_zone_id` interno.
 */

export type PostUnitZone = {
    id: number;
    unit: { id: number; name: string };
    zone: { id: number; name: string };
};

export type Post = {
    id: number;
    name: string;
    address: string | null;
    description: string | null;
    is_active: boolean;
    unit_zone: PostUnitZone;
    created_at: string;
    updated_at: string;
};

export type PostStats = {
    total: number;
    activos: number;
    inactivos: number;
    coincidencias: number;
};

export type PostEstadoFilter = 'todos' | 'activos' | 'inactivos';

export type PostFilters = {
    search: string;
    per_page: number;
    sort: string | null;
    direction: 'asc' | 'desc' | null;
    estado: PostEstadoFilter;
    unit_id: number | null;
    zone_id: number | null;
};

/** Catálogo Unidad → Zonales asignadas, para el select en cascada del formulario. */
export type UnitCatalogEntry = {
    id: number;
    name: string;
    zones: Array<{ id: number; name: string }>;
};

/** Catálogo plano de zonales, para el filtro "Zonal" del listado. */
export type ZoneCatalogEntry = {
    id: number;
    name: string;
};
