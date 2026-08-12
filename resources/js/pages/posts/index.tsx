import { Head } from '@inertiajs/react';
import {
    Activity,
    Building2,
    CheckCircle2,
    Filter,
    MapPin,
    MapPinned,
    PauseCircle,
    Plus,
    ScreenShare,
    ShieldCheck,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useDataTablePage } from '@/hooks/use-data-table-page';
import { useRowSelection } from '@/hooks/use-row-selection';
import { formatDate } from '@/lib/format';
import posts from '@/routes/posts';
import type { Paginated } from '@/types';
import { PostBulkDeleteDialog } from './components/post-bulk-delete-dialog';
import { PostDeleteDialog } from './components/post-delete-dialog';
import { PostFormModal } from './components/post-form-modal';
import { PostRowActions } from './components/post-row-actions';
import type {
    Post,
    PostEstadoFilter,
    PostFilters,
    PostStats,
    UnitCatalogEntry,
    ZoneCatalogEntry,
} from './types';

type PostsIndexProps = {
    posts: Paginated<Post>;
    filters: PostFilters;
    stats: PostStats;
    units_catalog: readonly UnitCatalogEntry[];
    zones_catalog: readonly ZoneCatalogEntry[];
};

type ModalState =
    | { type: 'idle' }
    | { type: 'create' }
    | { type: 'edit'; post: Post }
    | { type: 'delete'; post: Post }
    | { type: 'bulk-delete' };

type PostFilterExtra = Pick<PostFilters, 'estado' | 'unit_id' | 'zone_id'>;

const DEFAULT_ESTADO: PostEstadoFilter = 'todos';
const DEFAULT_PER_PAGE = 10;
const ALL_UNITS_VALUE = 'todos';
const ALL_ZONES_VALUE = 'todos';

/**
 * Página principal del módulo Puestos (Estructura → Puestos, solo
 * superadmin). Réplica de la estructura del módulo Usuarios: mismos
 * componentes de tabla, filtros, paginación y modales.
 */
export default function Index({
    posts: paginated,
    filters,
    stats,
    units_catalog,
    zones_catalog,
}: PostsIndexProps) {
    const { search, setSearch, isLoading, sort, setSort, setPerPage, applyFilter } =
        useDataTablePage<PostFilterExtra>({
            routeUrl: posts.index().url,
            initialFilters: filters,
            only: ['posts', 'filters', 'stats'],
            errorMessage: 'No se pudo cargar el listado de puestos.',
        });

    const estadoOptions: readonly FilterChip<PostEstadoFilter>[] = useMemo(
        () => [
            { value: 'todos', label: 'Todos' },
            { value: 'activos', label: 'Activos' },
            { value: 'inactivos', label: 'Inactivos' },
        ],
        [],
    );

    const zoneFilterOptions = useMemo(() => {
        if (!filters.unit_id) {
            return zones_catalog;
        }

        const selectedUnit = units_catalog.find(
            (unit) => unit.id === filters.unit_id,
        );

        return selectedUnit ? selectedUnit.zones : zones_catalog;
    }, [filters.unit_id, units_catalog, zones_catalog]);

    const [modal, setModal] = useState<ModalState>({ type: 'idle' });

    const closeModal = useCallback(() => setModal({ type: 'idle' }), []);
    const openCreate = useCallback(() => setModal({ type: 'create' }), []);
    const openEdit = useCallback(
        (post: Post) => setModal({ type: 'edit', post }),
        [],
    );
    const openDelete = useCallback(
        (post: Post) => setModal({ type: 'delete', post }),
        [],
    );
    const openBulkDelete = useCallback(
        () => setModal({ type: 'bulk-delete' }),
        [],
    );

    const selection = useRowSelection<Post, DataTableRowId>({
        rows: paginated.data,
        rowKey: (post) => post.id,
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

        if (filters.unit_id) {
count += 1;
}

        if (filters.zone_id) {
count += 1;
}

        return count;
    }, [
        filters.search,
        filters.sort,
        filters.estado,
        filters.per_page,
        filters.unit_id,
        filters.zone_id,
    ]);

    const columns = useMemo<DataTableColumn<Post>[]>(
        () => [
            {
                key: 'name',
                header: 'Puesto',
                sortable: true,
                cell: (post) => (
                    <div className="flex items-center gap-2">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-gold-soft text-brand-gold-accent dark:bg-brand-gold/10 dark:text-brand-gold">
                            <ShieldCheck
                                className="size-4"
                                strokeWidth={2.25}
                            />
                        </span>
                        <div className="flex min-w-0 flex-col leading-tight">
                            <span className="truncate text-sm font-semibold text-foreground">
                                {post.name}
                            </span>
                            {post.address && (
                                <span className="truncate text-xs text-muted-foreground">
                                    {post.address}
                                </span>
                            )}
                        </div>
                    </div>
                ),
            },
            {
                key: 'unit',
                header: 'Unidad',
                showInMobile: true,
                cell: (post) => (
                    <div className="flex items-center gap-1.5">
                        <Building2
                            className="size-3.5 shrink-0 text-muted-foreground"
                            strokeWidth={2.25}
                        />
                        <span className="text-xs text-foreground/80">
                            {post.unit_zone.unit.name}
                        </span>
                    </div>
                ),
            },
            {
                key: 'zone',
                header: 'Zonal',
                cell: (post) => (
                    <div className="flex items-center gap-1.5">
                        <MapPinned
                            className="size-3.5 shrink-0 text-muted-foreground"
                            strokeWidth={2.25}
                        />
                        <span className="text-xs text-foreground/80">
                            {post.unit_zone.zone.name}
                        </span>
                    </div>
                ),
            },
            {
                key: 'status',
                header: 'Estado',
                cell: (post) =>
                    post.is_active ? (
                        <StatBadge label="Activo" value="" variant="success" />
                    ) : (
                        <StatBadge label="Inactivo" value="" variant="warning" />
                    ),
            },
            {
                key: 'created_at',
                header: 'Creado',
                sortable: true,
                cell: (post) => (
                    <span className="text-xs text-muted-foreground">
                        {formatDate(post.created_at)}
                    </span>
                ),
            },
            {
                key: 'acciones',
                header: <span className="md:sr-only">Acciones</span>,
                align: 'right',
                cell: (post: Post) => (
                    <div className="flex justify-end">
                        <PostRowActions
                            post={post}
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
            <Head title="Puestos" />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <PageHeader
                    title="Puestos"
                    description="Administra los puestos de vigilancia por unidad y zonal."
                    stats={[
                        {
                            label: 'Total',
                            value: stats.total,
                            variant: 'primary',
                            icon: MapPin,
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
                                Nuevo puesto
                            </span>
                            <span className="sm:hidden">Nuevo</span>
                        </Button>
                    }
                />

                <DataTable
                    columns={columns}
                    data={paginated.data}
                    rowKey={(post) => post.id}
                    sort={sort}
                    onSortChange={setSort}
                    isLoading={isLoading}
                    selection={selection}
                    ariaLiveMessage={`${stats.coincidencias} puestos encontrados`}
                    toolbar={
                        <DataToolbar
                            search={search}
                            onSearchChange={setSearch}
                            isSearching={isLoading}
                            placeholder="Buscar por nombre o dirección…"
                        >
                            <FilterChips
                                ariaLabel="Filtrar por estado"
                                value={filters.estado}
                                onChange={(estado) => applyFilter({ estado })}
                                options={estadoOptions}
                            />

                            <Select
                                value={
                                    filters.unit_id
                                        ? String(filters.unit_id)
                                        : ALL_UNITS_VALUE
                                }
                                onValueChange={(value) =>
                                    applyFilter({
                                        unit_id:
                                            value === ALL_UNITS_VALUE
                                                ? null
                                                : Number(value),
                                        zone_id: null,
                                    })
                                }
                            >
                                <SelectTrigger className="h-9 w-full min-w-[10rem] cursor-pointer sm:w-auto">
                                    <Building2
                                        className="size-3.5 shrink-0 text-muted-foreground/70"
                                        strokeWidth={2.25}
                                    />
                                    <SelectValue placeholder="Todas las unidades" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem
                                        value={ALL_UNITS_VALUE}
                                        className="cursor-pointer"
                                    >
                                        Todas las unidades
                                    </SelectItem>
                                    {units_catalog.map((unit) => (
                                        <SelectItem
                                            key={unit.id}
                                            value={String(unit.id)}
                                            className="cursor-pointer"
                                        >
                                            {unit.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={
                                    filters.zone_id
                                        ? String(filters.zone_id)
                                        : ALL_ZONES_VALUE
                                }
                                onValueChange={(value) =>
                                    applyFilter({
                                        zone_id:
                                            value === ALL_ZONES_VALUE
                                                ? null
                                                : Number(value),
                                    })
                                }
                            >
                                <SelectTrigger className="h-9 w-full min-w-[10rem] cursor-pointer sm:w-auto">
                                    <MapPinned
                                        className="size-3.5 shrink-0 text-muted-foreground/70"
                                        strokeWidth={2.25}
                                    />
                                    <SelectValue placeholder="Todos los zonales" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem
                                        value={ALL_ZONES_VALUE}
                                        className="cursor-pointer"
                                    >
                                        Todos los zonales
                                    </SelectItem>
                                    {zoneFilterOptions.map((zone) => (
                                        <SelectItem
                                            key={zone.id}
                                            value={String(zone.id)}
                                            className="cursor-pointer"
                                        >
                                            {zone.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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
                                unit_id: filters.unit_id ?? undefined,
                                zone_id: filters.zone_id ?? undefined,
                            }}
                        />
                    }
                    emptyState={
                        <EmptyState
                            icon={activeFiltersCount > 0 ? Activity : MapPin}
                            title={
                                activeFiltersCount > 0
                                    ? 'No hay coincidencias'
                                    : 'Todavía no hay puestos'
                            }
                            description={
                                activeFiltersCount > 0
                                    ? 'Ajusta la búsqueda o los filtros para encontrar lo que buscas.'
                                    : units_catalog.length === 0
                                      ? 'Crea primero una unidad y asígnale zonales.'
                                      : 'Crea el primer puesto de vigilancia.'
                            }
                            action={
                                activeFiltersCount === 0 &&
                                units_catalog.length > 0 ? (
                                    <Button
                                        type="button"
                                        onClick={openCreate}
                                        className="cursor-pointer gap-2"
                                    >
                                        <Plus
                                            className="size-4"
                                            strokeWidth={2.5}
                                        />
                                        Crear el primer puesto
                                    </Button>
                                ) : undefined
                            }
                        />
                    }
                />
            </div>

            <PostFormModal
                key={modal.type === 'edit' ? modal.post.id : 'create'}
                open={modal.type === 'create' || modal.type === 'edit'}
                onOpenChange={(open) => {
                    if (!open) {
closeModal();
}
                }}
                post={modal.type === 'edit' ? modal.post : null}
                unitsCatalog={units_catalog}
            />

            <PostDeleteDialog
                open={modal.type === 'delete'}
                onOpenChange={(open) => {
                    if (!open) {
closeModal();
}
                }}
                post={modal.type === 'delete' ? modal.post : null}
            />

            <PostBulkDeleteDialog
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
                    singular: 'puesto seleccionado',
                    plural: 'puestos seleccionados',
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
    breadcrumbs: [{ title: 'Puestos', href: posts.index() }],
};
