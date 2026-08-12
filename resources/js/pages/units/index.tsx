import { Head } from '@inertiajs/react';
import {
    Activity,
    Building2,
    CheckCircle2,
    Filter,
    MapPinned,
    PauseCircle,
    Plus,
    ScreenShare,
    Trash2,
} from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
    BulkAction,
    BulkActionBar,
    DataPagination,
    DataTable,
    DataToolbar,
    EmptyState,
    FilterChips,
    PageHeader,
    StatBadge,
} from '@/components/data-page';
import type {
    DataTableColumn,
    DataTableRowId,
    FilterChip,
} from '@/components/data-page';
import { Button } from '@/components/ui/button';
import { useDataTablePage } from '@/hooks/use-data-table-page';
import { useRowSelection } from '@/hooks/use-row-selection';
import { formatDate } from '@/lib/format';
import units from '@/routes/units';
import type { Paginated } from '@/types';
import { UnitBulkDeleteDialog } from './components/unit-bulk-delete-dialog';
import { UnitDeleteDialog } from './components/unit-delete-dialog';
import { UnitFormModal } from './components/unit-form-modal';
import { UnitRowActions } from './components/unit-row-actions';
import type {
    Unit,
    UnitEstadoFilter,
    UnitFilters,
    UnitStats,
    ZoneOption,
} from './types';

type UnitsIndexProps = {
    units: Paginated<Unit>;
    filters: UnitFilters;
    stats: UnitStats;
    zones_catalog: readonly ZoneOption[];
};

type ModalState =
    | { type: 'idle' }
    | { type: 'create' }
    | { type: 'edit'; unit: Unit }
    | { type: 'delete'; unit: Unit }
    | { type: 'bulk-delete' };

const DEFAULT_ESTADO: UnitEstadoFilter = 'todos';
const DEFAULT_PER_PAGE = 10;

/**
 * Página principal del módulo Unidades (Estructura → Unidades, solo
 * superadmin). Réplica de la estructura del módulo Usuarios: mismos
 * componentes de tabla, filtros, paginación y modales.
 */
export default function Index({
    units: paginated,
    filters,
    stats,
    zones_catalog,
}: UnitsIndexProps) {
    const { search, setSearch, isLoading, sort, setSort, setPerPage, applyFilter } =
        useDataTablePage<{ estado: UnitEstadoFilter }>({
            routeUrl: units.index().url,
            initialFilters: filters,
            only: ['units', 'filters', 'stats'],
            errorMessage: 'No se pudo cargar el listado de unidades.',
        });

    const estadoOptions: readonly FilterChip<UnitEstadoFilter>[] = useMemo(
        () => [
            { value: 'todos', label: 'Todos' },
            { value: 'activos', label: 'Activos' },
            { value: 'inactivos', label: 'Inactivos' },
        ],
        [],
    );

    const [modal, setModal] = useState<ModalState>({ type: 'idle' });

    const closeModal = useCallback(() => setModal({ type: 'idle' }), []);
    const openCreate = useCallback(() => setModal({ type: 'create' }), []);
    const openEdit = useCallback(
        (unit: Unit) => setModal({ type: 'edit', unit }),
        [],
    );
    const openDelete = useCallback(
        (unit: Unit) => setModal({ type: 'delete', unit }),
        [],
    );
    const openBulkDelete = useCallback(
        () => setModal({ type: 'bulk-delete' }),
        [],
    );

    const selection = useRowSelection<Unit, DataTableRowId>({
        rows: paginated.data,
        rowKey: (unit) => unit.id,
    });

    const activeFiltersCount = useMemo(() => {
        let count = 0;

        if (filters.search) {
count += 1;
}

        if (filters.sort) {
count += 1;
}

        if (filters.estado !== DEFAULT_ESTADO) {
count += 1;
}

        if (filters.per_page !== DEFAULT_PER_PAGE) {
count += 1;
}

        return count;
    }, [filters.search, filters.sort, filters.estado, filters.per_page]);

    const columns = useMemo<DataTableColumn<Unit>[]>(
        () => [
            {
                key: 'name',
                header: 'Unidad',
                sortable: true,
                cell: (unit) => (
                    <div className="flex items-center gap-2">
                        {unit.photo_url ? (
                            <img
                                src={unit.photo_url}
                                alt={unit.name}
                                className="size-8 shrink-0 rounded-full object-cover"
                            />
                        ) : (
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-gold-soft text-brand-gold-accent dark:bg-brand-gold/10 dark:text-brand-gold">
                                <Building2
                                    className="size-4"
                                    strokeWidth={2.25}
                                />
                            </span>
                        )}
                        <div className="flex min-w-0 flex-col leading-tight">
                            <span className="truncate text-sm font-semibold text-foreground">
                                {unit.name}
                            </span>
                            {unit.description && (
                                <span className="truncate text-xs text-muted-foreground">
                                    {unit.description}
                                </span>
                            )}
                        </div>
                    </div>
                ),
            },
            {
                key: 'zones',
                header: 'Zonales',
                showInMobile: true,
                cell: (unit) => (
                    <div className="flex items-center gap-1.5">
                        <MapPinned
                            className="size-3.5 shrink-0 text-muted-foreground"
                            strokeWidth={2.25}
                        />
                        <span className="text-xs text-foreground/80">
                            {unit.zones?.length ?? 0}{' '}
                            {(unit.zones?.length ?? 0) === 1
                                ? 'zonal'
                                : 'zonales'}
                        </span>
                    </div>
                ),
            },
            {
                key: 'status',
                header: 'Estado',
                cell: (unit) =>
                    unit.is_active ? (
                        <StatBadge label="Activo" value="" variant="success" />
                    ) : (
                        <StatBadge label="Inactivo" value="" variant="warning" />
                    ),
            },
            {
                key: 'created_at',
                header: 'Creado',
                sortable: true,
                cell: (unit) => (
                    <span className="text-xs text-muted-foreground">
                        {formatDate(unit.created_at)}
                    </span>
                ),
            },
            {
                key: 'acciones',
                header: <span className="md:sr-only">Acciones</span>,
                align: 'right',
                cell: (unit: Unit) => (
                    <div className="flex justify-end">
                        <UnitRowActions
                            unit={unit}
                            onEdit={openEdit}
                            onDelete={openDelete}
                        />
                    </div>
                ),
                className: 'w-12',
            },
        ],
        [openEdit, openDelete],
    );

    return (
        <>
            <Head title="Unidades" />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <PageHeader
                    title="Unidades"
                    description="Administra las unidades (sedes/locales) de la empresa."
                    stats={[
                        {
                            label: 'Total',
                            value: stats.total,
                            variant: 'primary',
                            icon: Building2,
                        },
                        {
                            label: 'Activas',
                            value: stats.activos,
                            variant: 'success',
                            icon: CheckCircle2,
                        },
                        {
                            label: 'Inactivas',
                            value: stats.inactivos,
                            variant: 'warning',
                            icon: PauseCircle,
                        },
                        {
                            label: 'Filtros',
                            value: activeFiltersCount,
                            variant: 'warning',
                            icon: Filter,
                        },
                        {
                            label: 'Coincidencias',
                            value: stats.coincidencias,
                            variant: 'info',
                            icon: ScreenShare,
                        },
                    ]}
                    action={
                        <Button
                            type="button"
                            onClick={openCreate}
                            className="cursor-pointer gap-2"
                        >
                            <Plus className="size-4" strokeWidth={2.5} />
                            <span className="hidden sm:inline">
                                Nueva unidad
                            </span>
                            <span className="sm:hidden">Nueva</span>
                        </Button>
                    }
                />

                <DataTable
                    columns={columns}
                    data={paginated.data}
                    rowKey={(unit) => unit.id}
                    sort={sort}
                    onSortChange={setSort}
                    isLoading={isLoading}
                    selection={selection}
                    ariaLiveMessage={`${stats.coincidencias} unidades encontradas`}
                    toolbar={
                        <DataToolbar
                            search={search}
                            onSearchChange={setSearch}
                            isSearching={isLoading}
                            placeholder="Buscar por nombre o descripción…"
                        >
                            <FilterChips
                                ariaLabel="Filtrar por estado"
                                value={filters.estado}
                                onChange={(estado) => applyFilter({ estado })}
                                options={estadoOptions}
                            />
                        </DataToolbar>
                    }
                    footer={
                        <DataPagination
                            meta={paginated}
                            onPerPageChange={setPerPage}
                            preservedQuery={{
                                search: filters.search || undefined,
                                per_page: filters.per_page,
                                sort: filters.sort ?? undefined,
                                direction: filters.direction ?? undefined,
                                estado:
                                    filters.estado !== DEFAULT_ESTADO
                                        ? filters.estado
                                        : undefined,
                            }}
                        />
                    }
                    emptyState={
                        <EmptyState
                            icon={activeFiltersCount > 0 ? Activity : Building2}
                            title={
                                activeFiltersCount > 0
                                    ? 'No hay coincidencias'
                                    : 'Todavía no hay unidades'
                            }
                            description={
                                activeFiltersCount > 0
                                    ? 'Ajusta la búsqueda o los filtros para encontrar lo que buscas.'
                                    : 'Crea la primera unidad de la empresa.'
                            }
                            action={
                                activeFiltersCount === 0 ? (
                                    <Button
                                        type="button"
                                        onClick={openCreate}
                                        className="cursor-pointer gap-2"
                                    >
                                        <Plus
                                            className="size-4"
                                            strokeWidth={2.5}
                                        />
                                        Crear la primera unidad
                                    </Button>
                                ) : undefined
                            }
                        />
                    }
                />
            </div>

            <UnitFormModal
                key={modal.type === 'edit' ? modal.unit.id : 'create'}
                open={modal.type === 'create' || modal.type === 'edit'}
                onOpenChange={(open) => {
                    if (!open) {
closeModal();
}
                }}
                unit={modal.type === 'edit' ? modal.unit : null}
                zonesCatalog={zones_catalog}
            />

            <UnitDeleteDialog
                open={modal.type === 'delete'}
                onOpenChange={(open) => {
                    if (!open) {
closeModal();
}
                }}
                unit={modal.type === 'delete' ? modal.unit : null}
            />

            <UnitBulkDeleteDialog
                open={modal.type === 'bulk-delete'}
                onOpenChange={(open) => {
                    if (!open) {
closeModal();
}
                }}
                ids={Array.from(selection.selectedIds) as number[]}
                onCompleted={() => selection.clear()}
            />

            <BulkActionBar
                count={selection.count}
                labels={{
                    singular: 'unidad seleccionada',
                    plural: 'unidades seleccionadas',
                }}
                onClear={selection.clear}
            >
                <BulkAction
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={openBulkDelete}
                    className="cursor-pointer gap-1.5"
                >
                    <Trash2 className="size-4" strokeWidth={2.5} />
                    <span className="hidden sm:inline">
                        Eliminar seleccionados
                    </span>
                </BulkAction>
            </BulkActionBar>
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Unidades', href: units.index() }],
};
