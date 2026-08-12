import { Head, usePage } from '@inertiajs/react';
import {
    Activity,
    Building2,
    CalendarClock,
    FileSpreadsheet,
    Filter,
    Layers,
    MapPin,
    MapPinned,
    Paperclip,
    Plus,
    ScreenShare,
    ShieldAlert,
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
import { formatDateTime } from '@/lib/format';
import incidents from '@/routes/incidents';
import type { Auth, Paginated } from '@/types';
import { IncidentBulkDeleteDialog } from './components/incident-bulk-delete-dialog';
import { IncidentDateRangeFilter } from './components/incident-date-range-filter';
import { IncidentDeleteDialog } from './components/incident-delete-dialog';
import { IncidentFormModal } from './components/incident-form-modal';
import { IncidentRowActions } from './components/incident-row-actions';
import type {
    Incident,
    IncidentAgentUnit,
    IncidentEvidenciaFilter,
    IncidentFilters,
    IncidentPostCatalogEntry,
    IncidentStats,
    IncidentUnitCatalogEntry,
    IncidentZoneCatalogEntry,
    ReasonCatalogEntry,
} from './types';

type IncidentsIndexProps = {
    incidents: Paginated<Incident>;
    filters: IncidentFilters;
    stats: IncidentStats;
    reasons_catalog: readonly ReasonCatalogEntry[];
    units_catalog: readonly IncidentUnitCatalogEntry[];
    unit: IncidentAgentUnit | null;
};

type ModalState =
    | { type: 'idle' }
    | { type: 'create' }
    | { type: 'edit'; incident: Incident }
    | { type: 'delete'; incident: Incident }
    | { type: 'bulk-delete' };

type IncidentFilterExtra = Pick<
    IncidentFilters,
    'evidencia' | 'desde' | 'hasta' | 'post_id' | 'unit_id' | 'zone_id'
>;

const DEFAULT_EVIDENCIA: IncidentEvidenciaFilter = 'todos';
const DEFAULT_PER_PAGE = 10;
const ALL_POSTS_VALUE = 'todos';
const ALL_UNITS_VALUE = 'todas';
const ALL_ZONES_VALUE = 'todas';

const todayIso = (): string => {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/**
 * Página principal del módulo Incidencias. El alcance depende del
 * rol autenticado:
 * - Agente: solo ve incidencias de su propio puesto, con filtro de
 *   rango de fechas (por defecto "hoy") y solo puede editar/eliminar
 *   las que él mismo reportó.
 * - Superadmin: ve todas las incidencias de todos los puestos, con
 *   columnas extra (Unidad/Zonal/Puesto), filtro por puesto y acceso
 *   a acciones masivas.
 */
export default function Index({
    incidents: paginated,
    filters,
    stats,
    reasons_catalog: reasonsCatalog,
    units_catalog: unitsCatalog,
    unit,
}: IncidentsIndexProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isSuperAdmin = auth.user.role === 'superadmin';
    const currentUserId = auth.user.id;

    const {
        search,
        setSearch,
        isLoading,
        sort,
        setSort,
        setPerPage,
        applyFilter,
    } = useDataTablePage<IncidentFilterExtra>({
        routeUrl: incidents.index().url,
        initialFilters: filters,
        only: ['incidents', 'filters', 'stats'],
        errorMessage: 'No se pudo cargar el listado de incidencias.',
    });

    const evidenciaOptions: readonly FilterChip<IncidentEvidenciaFilter>[] =
        useMemo(
            () => [
                { value: 'todos', label: 'Todas' },
                { value: 'con', label: 'Con evidencia' },
                { value: 'sin', label: 'Sin evidencia' },
            ],
            [],
        );

    const selectedUnit = useMemo(
        () =>
            unitsCatalog.find(
                (catalogUnit) => catalogUnit.id === filters.unit_id,
            ),
        [unitsCatalog, filters.unit_id],
    );

    // Filtro en cascada Unidad → Zonal → Puesto: al elegir una Unidad
    // se acotan las Zonales a las suyas, y al elegir también una
    // Zonal se acotan los Puestos a esa combinación exacta. Sin
    // Unidad elegida, se muestran todas las Zonales/Puestos (sin
    // duplicados, ya que una misma Zonal puede pertenecer a varias
    // Unidades).
    const zoneFilterOptions = useMemo<
        readonly IncidentZoneCatalogEntry[]
    >(() => {
        if (selectedUnit) {
            return selectedUnit.zones;
        }

        // Sin Unidad elegida: una misma Zonal puede repetirse en
        // varias Unidades, cada una con sus propios Puestos, así que
        // se fusionan por id de zonal uniendo también sus Puestos.
        const zoneMap = new Map<number, IncidentZoneCatalogEntry>();
        unitsCatalog.forEach((catalogUnit) =>
            catalogUnit.zones.forEach((zone) => {
                const existing = zoneMap.get(zone.id);

                if (!existing) {
                    zoneMap.set(zone.id, zone);

                    return;
                }

                const postMap = new Map(
                    existing.posts.map((post) => [post.id, post]),
                );
                zone.posts.forEach((post) => postMap.set(post.id, post));
                zoneMap.set(zone.id, {
                    ...existing,
                    posts: Array.from(postMap.values()),
                });
            }),
        );

        return Array.from(zoneMap.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
        );
    }, [selectedUnit, unitsCatalog]);

    const postFilterOptions = useMemo<
        readonly IncidentPostCatalogEntry[]
    >(() => {
        if (filters.zone_id) {
            const zone = zoneFilterOptions.find(
                (candidate) => candidate.id === filters.zone_id,
            );

            return zone?.posts ?? [];
        }

        const posts = zoneFilterOptions.flatMap((zone) => zone.posts);
        const seen = new Map<number, IncidentPostCatalogEntry>();
        posts.forEach((post) => {
            if (!seen.has(post.id)) {
                seen.set(post.id, post);
            }
        });

        return Array.from(seen.values()).sort((a, b) =>
            a.name.localeCompare(b.name),
        );
    }, [zoneFilterOptions, filters.zone_id]);

    const [modal, setModal] = useState<ModalState>({ type: 'idle' });

    const closeModal = useCallback(() => setModal({ type: 'idle' }), []);
    const openCreate = useCallback(() => setModal({ type: 'create' }), []);
    const openEdit = useCallback(
        (incident: Incident) => setModal({ type: 'edit', incident }),
        [],
    );
    const openDelete = useCallback(
        (incident: Incident) => setModal({ type: 'delete', incident }),
        [],
    );
    const openBulkDelete = useCallback(
        () => setModal({ type: 'bulk-delete' }),
        [],
    );

    const selection = useRowSelection<Incident, DataTableRowId>({
        rows: paginated.data,
        rowKey: (incident) => incident.id,
    });

    const canManage = useCallback(
        (incident: Incident): boolean =>
            isSuperAdmin || incident.user_id === currentUserId,
        [isSuperAdmin, currentUserId],
    );

    const activeFiltersCount = useMemo(() => {
        let count = 0;

        if (filters.search) {
            count += 1;
        }

        if (filters.sort) {
            count += 1;
        }

        if (filters.evidencia !== DEFAULT_EVIDENCIA) {
            count += 1;
        }

        if (filters.per_page !== DEFAULT_PER_PAGE) {
            count += 1;
        }

        if (!isSuperAdmin && filters.desde && filters.hasta) {
            const today = todayIso();

            if (filters.desde !== today || filters.hasta !== today) {
                count += 1;
            }
        }

        if (isSuperAdmin && filters.post_id) {
            count += 1;
        }

        if (isSuperAdmin && filters.unit_id) {
            count += 1;
        }

        if (isSuperAdmin && filters.zone_id) {
            count += 1;
        }

        return count;
    }, [
        filters.search,
        filters.sort,
        filters.evidencia,
        filters.per_page,
        filters.desde,
        filters.hasta,
        filters.post_id,
        filters.unit_id,
        filters.zone_id,
        isSuperAdmin,
    ]);

    const exportUrl = useMemo(() => {
        const params = new URLSearchParams();

        if (filters.search) {
            params.set('search', filters.search);
        }

        if (filters.evidencia !== DEFAULT_EVIDENCIA) {
            params.set('evidencia', filters.evidencia);
        }

        if (filters.desde) {
            params.set('desde', filters.desde);
        }

        if (filters.hasta) {
            params.set('hasta', filters.hasta);
        }

        if (filters.post_id) {
            params.set('post_id', String(filters.post_id));
        }

        if (filters.unit_id) {
            params.set('unit_id', String(filters.unit_id));
        }

        if (filters.zone_id) {
            params.set('zone_id', String(filters.zone_id));
        }

        const qs = params.toString();

        return qs.length > 0
            ? `${incidents.export().url}?${qs}`
            : incidents.export().url;
    }, [
        filters.search,
        filters.evidencia,
        filters.desde,
        filters.hasta,
        filters.post_id,
        filters.unit_id,
        filters.zone_id,
    ]);

    const pageTitle = useMemo(() => {
        if (isSuperAdmin || !unit) {
            return 'Incidencias';
        }

        return (
            <span className="flex items-center gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-gold-soft ring-1 ring-brand-gold/40 dark:bg-brand-gold/10">
                    {unit.photo_url ? (
                        <img
                            src={unit.photo_url}
                            alt={unit.name}
                            className="size-full object-cover"
                        />
                    ) : (
                        <Building2
                            className="size-4 text-brand-gold-accent dark:text-brand-gold"
                            strokeWidth={2.25}
                        />
                    )}
                </span>
                <span>Incidencias de la Unidad {unit.name}</span>
            </span>
        );
    }, [isSuperAdmin, unit]);

    const columns = useMemo<DataTableColumn<Incident>[]>(() => {
        const base: DataTableColumn<Incident>[] = [
            {
                key: 'reason',
                header: 'Motivo',
                cell: (incident) => (
                    <div className="flex items-center gap-2">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-gold-soft text-brand-gold-accent dark:bg-brand-gold/10 dark:text-brand-gold">
                            <ShieldAlert
                                className="size-4"
                                strokeWidth={2.25}
                            />
                        </span>
                        <div className="flex min-w-0 flex-col leading-tight">
                            <span className="truncate text-sm font-semibold text-foreground">
                                {incident.reason?.name ?? 'Sin motivo'}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                                {incident.user
                                    ? `${incident.user.name} ${incident.user.last_name}`
                                    : 'Reportante desconocido'}
                            </span>
                        </div>
                    </div>
                ),
            },
            {
                key: 'detail',
                header: 'Detalle',
                showInMobile: true,
                cell: (incident) => (
                    <span className="line-clamp-2 max-w-xs text-xs text-foreground/80">
                        {incident.detail}
                    </span>
                ),
            },
        ];

        const structureColumns: DataTableColumn<Incident>[] = isSuperAdmin
            ? [
                  {
                      key: 'unit',
                      header: 'Unidad',
                      cell: (incident) => (
                          <span className="text-xs text-foreground/80">
                              {incident.user?.post?.unit_zone?.unit?.name ??
                                  '—'}
                          </span>
                      ),
                  },
                  {
                      key: 'zone',
                      header: 'Zonal',
                      cell: (incident) => (
                          <span className="text-xs text-foreground/80">
                              {incident.user?.post?.unit_zone?.zone?.name ??
                                  '—'}
                          </span>
                      ),
                  },
                  {
                      key: 'post',
                      header: 'Puesto',
                      cell: (incident) => (
                          <span className="text-xs text-foreground/80">
                              {incident.user?.post?.name ?? '—'}
                          </span>
                      ),
                  },
              ]
            : [];

        const gpsColumn: DataTableColumn<Incident>[] = isSuperAdmin
            ? [
                  {
                      key: 'gps',
                      header: 'GPS',
                      cell: (incident) =>
                          incident.latitude && incident.longitude ? (
                              <a
                                  href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Ver ubicación en Google Maps"
                                  className="inline-flex items-center gap-1.5 text-xs text-foreground/80 hover:text-brand-gold-accent hover:underline dark:hover:text-brand-gold"
                              >
                                  <MapPin
                                      className="size-3.5 shrink-0 text-muted-foreground"
                                      strokeWidth={2.25}
                                  />
                                  {Number(incident.latitude).toFixed(4)},{' '}
                                  {Number(incident.longitude).toFixed(4)}
                              </a>
                          ) : (
                              <span className="text-xs text-muted-foreground">
                                  Sin ubicación
                              </span>
                          ),
                  },
              ]
            : [];

        const rest: DataTableColumn<Incident>[] = [
            {
                key: 'occurred_at',
                header: 'Fecha y hora',
                sortable: true,
                cell: (incident) => (
                    <span className="text-xs text-muted-foreground">
                        {formatDateTime(incident.occurred_at)}
                    </span>
                ),
            },
            ...gpsColumn,
            {
                key: 'evidence',
                header: 'Evidencia',
                cell: (incident) =>
                    incident.evidence_url ? (
                        <a
                            href={incident.evidence_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-gold-accent hover:underline dark:text-brand-gold"
                        >
                            <Paperclip
                                className="size-3.5"
                                strokeWidth={2.25}
                            />
                            Ver archivo
                        </a>
                    ) : (
                        <span className="text-xs text-muted-foreground">
                            Sin evidencia
                        </span>
                    ),
            },
            {
                key: 'acciones',
                header: <span className="md:sr-only">Acciones</span>,
                align: 'right',
                cell: (incident: Incident) => (
                    <div className="flex justify-end">
                        <IncidentRowActions
                            incident={incident}
                            canManage={canManage(incident)}
                            onEdit={openEdit}
                            onDelete={openDelete}
                        />
                    </div>
                ),
                className: 'w-12',
            },
        ];

        return [...base, ...structureColumns, ...rest];
    }, [isSuperAdmin, canManage, openEdit, openDelete]);

    return (
        <>
            <Head
                title={
                    !isSuperAdmin && unit
                        ? `Incidencias · ${unit.name}`
                        : 'Incidencias'
                }
            />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <PageHeader
                    title={pageTitle}
                    description="Registra y consulta las incidencias reportadas en campo."
                    stats={[
                        {
                            label: 'Total',
                            value: stats.total,
                            variant: 'primary',
                            icon: ShieldAlert,
                        },
                        {
                            label: 'Con evidencia',
                            value: stats.con_evidencia,
                            variant: 'success',
                            icon: Paperclip,
                        },
                        {
                            label: 'Hoy',
                            value: stats.hoy,
                            variant: 'info',
                            icon: CalendarClock,
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
                        <div className="flex flex-row items-center gap-2">
                            <Button
                                asChild
                                variant="outline"
                                className="cursor-pointer gap-2 border-emerald-600/40 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/15"
                            >
                                <a href={exportUrl} download>
                                    <FileSpreadsheet
                                        className="size-4"
                                        strokeWidth={2.5}
                                    />
                                    <span className="hidden sm:inline">
                                        Exportar Excel
                                    </span>
                                    <span className="sm:hidden">Excel</span>
                                </a>
                            </Button>

                            <Button
                                type="button"
                                onClick={openCreate}
                                className="cursor-pointer gap-2"
                            >
                                <Plus className="size-4" strokeWidth={2.5} />
                                <span className="hidden sm:inline">
                                    Nueva incidencia
                                </span>
                                <span className="sm:hidden">Nueva</span>
                            </Button>
                        </div>
                    }
                />

                <DataTable
                    columns={columns}
                    data={paginated.data}
                    rowKey={(incident) => incident.id}
                    sort={sort}
                    onSortChange={setSort}
                    isLoading={isLoading}
                    selection={isSuperAdmin ? selection : undefined}
                    ariaLiveMessage={`${stats.coincidencias} incidencias encontradas`}
                    toolbar={
                        <DataToolbar
                            search={search}
                            onSearchChange={setSearch}
                            isSearching={isLoading}
                            placeholder="Buscar por detalle, motivo o reportante…"
                        >
                            <FilterChips
                                ariaLabel="Filtrar por evidencia"
                                value={filters.evidencia}
                                onChange={(evidencia) =>
                                    applyFilter({ evidencia })
                                }
                                options={evidenciaOptions}
                            />

                            {isSuperAdmin && (
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
                                            post_id: null,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-9 w-full min-w-44 cursor-pointer sm:w-auto">
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
                                        {unitsCatalog.map((catalogUnit) => (
                                            <SelectItem
                                                key={catalogUnit.id}
                                                value={String(catalogUnit.id)}
                                                className="cursor-pointer"
                                            >
                                                {catalogUnit.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {isSuperAdmin && (
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
                                            post_id: null,
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-9 w-full min-w-44 cursor-pointer sm:w-auto">
                                        <Layers
                                            className="size-3.5 shrink-0 text-muted-foreground/70"
                                            strokeWidth={2.25}
                                        />
                                        <SelectValue placeholder="Todas las zonales" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            value={ALL_ZONES_VALUE}
                                            className="cursor-pointer"
                                        >
                                            Todas las zonales
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
                            )}

                            {isSuperAdmin && (
                                <Select
                                    value={
                                        filters.post_id
                                            ? String(filters.post_id)
                                            : ALL_POSTS_VALUE
                                    }
                                    onValueChange={(value) =>
                                        applyFilter({
                                            post_id:
                                                value === ALL_POSTS_VALUE
                                                    ? null
                                                    : Number(value),
                                        })
                                    }
                                >
                                    <SelectTrigger className="h-9 w-full min-w-44 cursor-pointer sm:w-auto">
                                        <MapPinned
                                            className="size-3.5 shrink-0 text-muted-foreground/70"
                                            strokeWidth={2.25}
                                        />
                                        <SelectValue placeholder="Todos los puestos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem
                                            value={ALL_POSTS_VALUE}
                                            className="cursor-pointer"
                                        >
                                            Todos los puestos
                                        </SelectItem>
                                        {postFilterOptions.map((post) => (
                                            <SelectItem
                                                key={post.id}
                                                value={String(post.id)}
                                                className="cursor-pointer"
                                            >
                                                {post.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {!isSuperAdmin && (
                                <IncidentDateRangeFilter
                                    desde={filters.desde}
                                    hasta={filters.hasta}
                                    defaultDesde={todayIso()}
                                    defaultHasta={todayIso()}
                                    disabled={isLoading}
                                    onApply={(desde, hasta) =>
                                        applyFilter({ desde, hasta })
                                    }
                                />
                            )}
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
                                evidencia:
                                    filters.evidencia !== DEFAULT_EVIDENCIA
                                        ? filters.evidencia
                                        : undefined,
                                desde: filters.desde ?? undefined,
                                hasta: filters.hasta ?? undefined,
                                post_id: filters.post_id ?? undefined,
                                unit_id: filters.unit_id ?? undefined,
                                zone_id: filters.zone_id ?? undefined,
                            }}
                        />
                    }
                    emptyState={
                        <EmptyState
                            icon={
                                activeFiltersCount > 0 ? Activity : ShieldAlert
                            }
                            title={
                                activeFiltersCount > 0
                                    ? 'No hay coincidencias'
                                    : 'Todavía no hay incidencias'
                            }
                            description={
                                activeFiltersCount > 0
                                    ? 'Ajusta la búsqueda o los filtros para encontrar lo que buscas.'
                                    : 'Registra la primera incidencia.'
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
                                        Registrar la primera incidencia
                                    </Button>
                                ) : undefined
                            }
                        />
                    }
                />
            </div>

            <IncidentFormModal
                key={modal.type === 'edit' ? modal.incident.id : 'create'}
                open={modal.type === 'create' || modal.type === 'edit'}
                onOpenChange={(open) => {
                    if (!open) {
                        closeModal();
                    }
                }}
                incident={modal.type === 'edit' ? modal.incident : null}
                reasonsCatalog={reasonsCatalog}
            />

            <IncidentDeleteDialog
                open={modal.type === 'delete'}
                onOpenChange={(open) => {
                    if (!open) {
                        closeModal();
                    }
                }}
                incident={modal.type === 'delete' ? modal.incident : null}
            />

            {isSuperAdmin && (
                <>
                    <IncidentBulkDeleteDialog
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
                            singular: 'incidencia seleccionada',
                            plural: 'incidencias seleccionadas',
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
                                Eliminar seleccionadas
                            </span>
                        </BulkAction>
                    </BulkActionBar>
                </>
            )}
        </>
    );
}

Index.layout = {
    breadcrumbs: [{ title: 'Incidencias', href: incidents.index() }],
};
