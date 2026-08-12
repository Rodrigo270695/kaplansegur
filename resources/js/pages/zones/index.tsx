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
import zones from '@/routes/zones';
import type { Paginated } from '@/types';
import { ZoneBulkDeleteDialog } from './components/zone-bulk-delete-dialog';
import { ZoneDeleteDialog } from './components/zone-delete-dialog';
import { ZoneFormModal } from './components/zone-form-modal';
import { ZoneRowActions } from './components/zone-row-actions';
import type { Zone, ZoneEstadoFilter, ZoneFilters, ZoneStats } from './types';

type ZonesIndexProps = {
    zones: Paginated<Zone>;
    filters: ZoneFilters;
    stats: ZoneStats;
};

type ModalState =
    | { type: 'idle' }
    | { type: 'create' }
    | { type: 'edit'; zone: Zone }
    | { type: 'delete'; zone: Zone }
    | { type: 'bulk-delete' };

const DEFAULT_ESTADO: ZoneEstadoFilter = 'todos';
const DEFAULT_PER_PAGE = 10;

/**
 * Página principal del módulo Zonales (Estructura → Zonales, solo
 * superadmin). Réplica de la estructura del módulo Usuarios: mismos
 * componentes de tabla, filtros, paginación y modales.
 */
export default function Index({
    zones: paginated,
    filters,
    stats,
}: ZonesIndexProps) {
    const { search, setSearch, isLoading, sort, setSort, setPerPage, applyFilter } =
        useDataTablePage<{ estado: ZoneEstadoFilter }>({
            routeUrl: zones.index().url,
            initialFilters: filters,
            only: ['zones', 'filters', 'stats'],
            errorMessage: 'No se pudo cargar el listado de zonales.',
        });

    const estadoOptions: readonly FilterChip<ZoneEstadoFilter>[] = useMemo(
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
        (zone: Zone) => setModal({ type: 'edit', zone }),
        [],
    );
    const openDelete = useCallback(
        (zone: Zone) => setModal({ type: 'delete', zone }),
        [],
    );
    const openBulkDelete = useCallback(
        () => setModal({ type: 'bulk-delete' }),
        [],
    );

    const selection = useRowSelection<Zone, DataTableRowId>({
        rows: paginated.data,
        rowKey: (zone) => zone.id,
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

    const columns = useMemo<DataTableColumn<Zone>[]>(
        () => [
            {
                key: 'name',
                header: 'Zonal',
                sortable: true,
                cell: (zone) => (
                    <div className="flex items-center gap-2">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-gold-soft text-brand-gold-accent dark:bg-brand-gold/10 dark:text-brand-gold">
                            <MapPinned
                                className="size-4"
                                strokeWidth={2.25}
                            />
                        </span>
                        <div className="flex min-w-0 flex-col leading-tight">
                            <span className="truncate text-sm font-semibold text-foreground">
                                {zone.name}
                            </span>
                            {zone.description && (
                                <span className="truncate text-xs text-muted-foreground">
                                    {zone.description}
                                </span>
                            )}
                        </div>
                    </div>
                ),
            },
            {
                key: 'units',
                header: 'Unidades',
                showInMobile: true,
                cell: (zone) => (
                    <div className="flex items-center gap-1.5">
                        <Building2
                            className="size-3.5 shrink-0 text-muted-foreground"
                            strokeWidth={2.25}
                        />
                        <span className="text-xs text-foreground/80">
                            {zone.units?.length ?? 0}{' '}
                            {(zone.units?.length ?? 0) === 1
                                ? 'unidad'
                                : 'unidades'}
                        </span>
                    </div>
                ),
            },
            {
                key: 'status',
                header: 'Estado',
                cell: (zone) =>
                    zone.is_active ? (
                        <StatBadge label="Activo" value="" variant="success" />
                    ) : (
                        <StatBadge label="Inactivo" value="" variant="warning" />
                    ),
            },
            {
                key: 'created_at',
                header: 'Creado',
                sortable: true,
                cell: (zone) => (
                    <span className="text-xs text-muted-foreground">
                        {formatDate(zone.created_at)}
                    </span>
                ),
            },
            {
                key: 'acciones',
                header: <span className="md:sr-only">Acciones</span>,
                align: 'right',
                cell: (zone: Zone) => (
                    <div className="flex justify-end">
                        <ZoneRowActions
                            zone={zone}
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
            <Head title="Zonales" />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <PageHeader
                    title="Zonales"
                    description="Administra los zonales de operación de la empresa."
                    stats={[
                        {
                            label: 'Total',
                            value: stats.total,
                            variant: 'primary',
                            icon: MapPinned,
                        },
                        {
                            label: 'Activos',
                            value: stats.activos,
                            variant: 'success',
                            icon: CheckCircle2,
                        },
                        {
                            label: 'Inactivos',
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
                                Nuevo zonal
                            </span>
                            <span className="sm:hidden">Nuevo</span>
                        </Button>
                    }
                />

                <DataTable
                    columns={columns}
                    data={paginated.data}
                    rowKey={(zone) => zone.id}
                    sort={sort}
                    onSortChange={setSort}
                    isLoading={isLoading}
                    selection={selection}
                    ariaLiveMessage={`${stats.coincidencias} zonales encontrados`}
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
                            icon={activeFiltersCount > 0 ? Activity : MapPinned}
                            title={
                                activeFiltersCount > 0
                                    ? 'No hay coincidencias'
                                    : 'Todavía no hay zonales'
                            }
                            description={
                                activeFiltersCount > 0
                                    ? 'Ajusta la búsqueda o los filtros para encontrar lo que buscas.'
                                    : 'Crea el primer zonal de operación.'
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
                                        Crear el primer zonal
                                    </Button>
                                ) : undefined
                            }
                        />
                    }
                />
            </div>

            <ZoneFormModal
                key={modal.type === 'edit' ? modal.zone.id : 'create'}
                open={modal.type === 'create' || modal.type === 'edit'}
                onOpenChange={(open) => {
                    if (!open) {
closeModal();
}
                }}
                zone={modal.type === 'edit' ? modal.zone : null}
            />

            <ZoneDeleteDialog
                open={modal.type === 'delete'}
                onOpenChange={(open) => {
                    if (!open) {
closeModal();
}
                }}
                zone={modal.type === 'delete' ? modal.zone : null}
            />

            <ZoneBulkDeleteDialog
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
                    singular: 'zonal seleccionado',
                    plural: 'zonales seleccionados',
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
    breadcrumbs: [{ title: 'Zonales', href: zones.index() }],
};
