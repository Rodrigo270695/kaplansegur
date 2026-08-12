/**
 * Tipos del módulo Usuarios (Configuración → Usuarios).
 *
 *   - Entidad principal (`User`), reutiliza el tipo global `@/types` y
 *     añade el campo `is_active` propio de este módulo.
 *   - Filtros del listado (`UserFilters`).
 *   - Stats para los badges del PageHeader.
 *   - Catálogo de roles (`UserRoleOption`) que viaja en cada `index()`
 *     y alimenta tanto el filtro segmentado como el `<select>` del modal.
 */
import type { User as AuthUser, DocumentType, Role } from '@/types';

export type User = AuthUser;

export type UserStats = {
    total: number;
    activos: number;
    inactivos: number;
    /** Coincidencias con los filtros vigentes (todas las páginas). */
    coincidencias: number;
};

export type UserEstadoFilter = 'todos' | 'activos' | 'inactivos';

export type UserFilters = {
    search: string;
    per_page: number;
    sort: string | null;
    direction: 'asc' | 'desc' | null;
    estado: UserEstadoFilter;
    /** Rol filtrado (o null para "todos"). */
    role: Role | null;
};

/** Catálogo de roles disponibles para asignar a un usuario. */
export type UserRoleOption = {
    value: Role;
    label: string;
};

/** Catálogo de puestos disponibles para asignar a un usuario. */
export type UserPostOption = {
    id: number;
    name: string;
    unit_name: string;
    zone_name: string;
};

export type { DocumentType, Role };

/** Espejo de `App\Enums\DocumentType::label()` para no golpear al backend. */
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    dni: 'DNI',
    ce: 'Carné de Extranjería',
    passport: 'Pasaporte',
    ruc: 'RUC',
};

export const DOCUMENT_TYPE_OPTIONS: readonly DocumentType[] = [
    'dni',
    'ce',
    'passport',
    'ruc',
];
