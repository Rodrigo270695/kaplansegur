import { Head } from '@inertiajs/react';
import {
    Activity,
    CheckCircle2,
    FileWarning,
    Filter,
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
import reasons from '@/routes/reasons';
import type { Paginated } from '@/types';
import { ReasonBulkDeleteDialog } from './components/reason-bulk-delete-dialog';
import { ReasonDeleteDialog } from './components/reason-delete-dialog';
import { ReasonFormModal } from './components/reason-form-modal';
import { ReasonRowActions } from './components/reason-row-actions';
import type {
    Reason,
    ReasonEstadoFilter,
    ReasonFilters,
    ReasonStats,
} from './types';

type ReasonsIndexProps = {
    reasons: Paginated<Reason>;
    filters: ReasonFilters;
    stats: ReasonStats;
};

type ModalState =
    | { type: 'idle' }
    | { type: 'create' }
    | { type: 'edit'; reason: Reason }
    | { type: 'delete'; reason: Reason }
    | { type: 'bulk-delete' };

const DEFAULT_ESTADO: ReasonEstadoFilter = 'todos';
const DEFAULT_PER_PAGE = 10;

/**
 * Página principal del módulo Motivos (Incidencias → Motivos, solo
 * superadmin). Réplica de la estructura del módulo Usuarios: mismos
 * componentes de tabla, filtros, paginación y modales.
 */
export default function Index({
    reasons: paginated,
    filters,
    stats,
}: ReasonsIndexProps) {
    const { search, setSearch, isLoading, sort, setSort, setPerPage, applyFilter } =
        useDataTablePage<{ estado: ReasonEstadoFilter }>({
            routeUrl: reasons.index().url,
            initialFilters: filters,
            only: ['reasons', 'filters', 'stats'],
            errorMessage: 'No se pudo cargar el listado de motivos.',
        });

    const estadoOptions: readonly FilterChip<ReasonEstadoFilter>[] = useMemo(
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
        (reason: Reason) => setModal({ type: 'edit', reason }),
        [],
    );
    const openDelete = useCallback(
        (reason: Reason) => setModal({ type: 'delete', reason }),
        [],
    );
    const openBulkDelete = useCallback(
        () => setModal({ type: 'bulk-delete' }),
        [],
    );

    const selection = useRowSelection<Reason, DataTableRowId>({
        rows: paginated.data,
        rowKey: (reason) => reason.id,
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

    const columns = useMemo<DataTableColumn<Reason>[]>(
        () => [
            {
                key: 'name',
                header: 'Motivo',
                sortable: true,
                cell: (reason) => (
                    <div className="flex items-center gap-2">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-gold-soft text-brand-gold-accent dark:bg-brand-gold/10 dark:text-brand-gold">
                            <FileWarning
                                className="size-4"
                                strokeWidth={2.25}
                            />
                        </span>
                        <span className="truncate text-sm font-semibold text-foreground">
                            {reason.name}
                        </span>
                    </div>
                ),
            },
            {
                key: 'status',
                header: 'Estado',
                cell: (reason) =>
                    reason.is_active ? (
                        <StatBadge label="Activo" value="" variant="success" />
                    ) : (
                        <StatBadge label="Inactivo" value="" variant="warning" />
                    ),
            },
            {
                key: 'created_at',
                header: 'Creado',
                sortable: true,
                cell: (reason) => (
                    <span className="text-xs text-muted-foreground">
                        {formatDate(reason.created_at)}
                    </span>
                ),
            },
            {
                key: 'acciones',
                header: <span className="md:sr-only">Acciones</span>,
                align: 'right',
                cell: (reason: Reason) => (
                    <div className="flex justify-end">
                        <ReasonRowActions
                            reason={reason}
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
            <Head title="Motivos" />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <PageHeader
                    title="Motivos"
                    description="Administra los motivos disponibles para reportar incidencias."
                    stats={[
                        {
                            label: 'Total',
                            value: stats.total,
                            variant: 'primary',
                            icon: FileWarning,
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
                                Nuevo motivo
                            </span>
                            <span className="sm:hidden">Nuevo</span>
                        </Button>
                    }
                />

                <DataTable
                    columns={columns}
                    data={paginated.data}
                    rowKey={(reason) => reason.id}
                    sort={sort}
                    onSortChange={setSort}
                    isLoading={isLoading}
                    selection={selection}
                    ariaLiveMessage={`${stats.coincidencias} motivos encontrados`}
                    toolbar={
                        <DataToolbar
                            search={search}
                            onSearchChange={setSearch}
                            isSearching={isLoading}
                            placeholder="Buscar por nombre…"
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
                            icon={activeFiltersCount > 0 ? Activity : FileWarning}
                            title={
                                activeFiltersCount > 0
                                    ? 'No hay coincidencias'
                                    : 'Todavía no hay motivos'
                            }
                            description={
                                activeFiltersCount > 0
                                    ? 'Ajusta la búsqueda o los filtros para encontrar lo que buscas.'
                                    : 'Crea el primer motivo de incidencia.'
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
                                        Crear el primer motivo
                                    </Button>
                                ) : undefined
                            }
                        />
                    }
                />
            </div>

            <ReasonFormModal
                key={modal.type === 'edit' ? modal.reason.id : 'create'}
                open={modal.type === 'create' || modal.type === 'edit'}
                onOpenChange={(open) => {
                    if (!open) {
                        closeModal();
                    }
                }}
                reason={modal.type === 'edit' ? modal.reason : null}
            />

            <ReasonDeleteDialog
                open={modal.type === 'delete'}
                onOpenChange={(open) => {
                    if (!open) {
                        closeModal();
                    }
                }}
                reason={modal.type === 'delete' ? modal.reason : null}
            />

            <ReasonBulkDeleteDialog
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
                    singular: 'motivo seleccionado',
                    plural: 'motivos seleccionados',
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
    breadcrumbs: [{ title: 'Motivos', href: reasons.index() }],
};
