import { Head, usePage } from '@inertiajs/react';
import {
    Activity,
    CheckCircle2,
    FileSpreadsheet,
    Filter,
    IdCard,
    Mail,
    MapPin,
    PauseCircle,
    Phone,
    Plus,
    ScreenShare,
    ShieldCheck,
    Trash2,
    UserCog,
    Users as UsersIcon,
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
import users from '@/routes/users';
import type { Auth, Paginated } from '@/types';
import { UserBulkDeleteDialog } from './components/user-bulk-delete-dialog';
import { UserDeleteDialog } from './components/user-delete-dialog';
import { UserFormModal } from './components/user-form-modal';
import { UserRowActions } from './components/user-row-actions';
import { DOCUMENT_TYPE_LABELS } from './types';
import type {
    User,
    UserEstadoFilter,
    UserFilters,
    UserPostOption,
    UserRoleOption,
    UserStats,
} from './types';

type UsersIndexProps = {
    users: Paginated<User>;
    filters: UserFilters;
    stats: UserStats;
    roles_catalog: readonly UserRoleOption[];
    posts_catalog: readonly UserPostOption[];
};

/**
 * State machine de modales del módulo Usuarios.
 */
type ModalState =
    | { type: 'idle' }
    | { type: 'create' }
    | { type: 'edit'; user: User }
    | { type: 'delete'; user: User }
    | { type: 'bulk-delete' };

const DEFAULT_ESTADO: UserEstadoFilter = 'todos';
const DEFAULT_PER_PAGE = 10;

/**
 * Página principal del módulo Usuarios (solo accesible para superadmin).
 *
 *  - `PageHeader` con título, descripción, stats y botón de creación.
 *  - `DataTable` con búsqueda + filtro por estado, paginación, selección
 *    múltiple y `aria-live` con el conteo de coincidencias.
 *  - Modales create / edit / delete / bulk-delete bajo una state machine.
 *  - Export CSV respetando los filtros vigentes.
 *
 *  Particularidades:
 *   - La propia sesión y las cuentas `superadmin` nunca pueden eliminarse
 *     (la UI muestra un candado y el backend también lo bloquea).
 *   - `roles_catalog` viaja con cada `index()` para mantener el select
 *     del modal sincronizado con el enum `Role` del backend.
 */
export default function Index({
    users: paginated,
    filters,
    stats,
    roles_catalog,
    posts_catalog,
}: UsersIndexProps) {
    const page = usePage<{ auth: Auth }>();
    const currentUserId = page.props.auth.user?.id ?? null;

    const {
        search,
        setSearch,
        isLoading,
        sort,
        setSort,
        setPerPage,
        applyFilter,
    } = useDataTablePage<{ estado: UserEstadoFilter }>({
        routeUrl: users.index().url,
        initialFilters: filters,
        only: ['users', 'filters', 'stats'],
        errorMessage: 'No se pudo cargar el listado de usuarios.',
    });

    const estadoOptions: readonly FilterChip<UserEstadoFilter>[] = useMemo(
        () => [
            { value: 'todos', label: 'Todos' },
            { value: 'activos', label: 'Activos' },
            { value: 'inactivos', label: 'Suspendidos' },
        ],
        [],
    );

    const [modal, setModal] = useState<ModalState>({ type: 'idle' });

    const closeModal = useCallback(() => setModal({ type: 'idle' }), []);
    const openCreate = useCallback(() => setModal({ type: 'create' }), []);
    const openEdit = useCallback(
        (user: User) => setModal({ type: 'edit', user }),
        [],
    );
    const openDelete = useCallback(
        (user: User) => setModal({ type: 'delete', user }),
        [],
    );
    const openBulkDelete = useCallback(
        () => setModal({ type: 'bulk-delete' }),
        [],
    );

    const selection = useRowSelection<User, DataTableRowId>({
        rows: paginated.data,
        rowKey: (user) => user.id,
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

    const exportUrl = useMemo(() => {
        const params = new URLSearchParams();

        if (filters.search) {
            params.set('search', filters.search);
        }

        if (filters.sort) {
            params.set('sort', filters.sort);
        }

        if (filters.direction) {
            params.set('direction', filters.direction);
        }

        if (filters.estado !== DEFAULT_ESTADO) {
            params.set('estado', filters.estado);
        }

        const qs = params.toString();

        return qs.length > 0
            ? `${users.export().url}?${qs}`
            : users.export().url;
    }, [filters.search, filters.sort, filters.direction, filters.estado]);

    const columns = useMemo<DataTableColumn<User>[]>(() => {
        const base: DataTableColumn<User>[] = [
            {
                key: 'name',
                header: 'Usuario',
                sortable: true,
                cell: (user) => {
                    const isSelf = currentUserId === user.id;
                    const isSuperadmin = user.role === 'superadmin';

                    return (
                        <div className="flex items-center gap-2">
                            <span
                                className={
                                    isSuperadmin
                                        ? 'flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                        : 'flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-gold-soft text-brand-gold-accent dark:bg-brand-gold/10 dark:text-brand-gold'
                                }
                            >
                                <UserCog
                                    className="size-4"
                                    strokeWidth={2.25}
                                />
                            </span>
                            <div className="flex min-w-0 flex-col leading-tight">
                                <div className="flex items-center gap-1.5">
                                    <span className="truncate text-sm font-semibold text-foreground">
                                        {user.name} {user.last_name}
                                    </span>
                                    {isSelf && (
                                        <StatBadge
                                            label="Tú"
                                            value=""
                                            variant="primary"
                                        />
                                    )}
                                </div>
                                <span className="truncate text-xs text-muted-foreground">
                                    @{user.username} · {user.email}
                                </span>
                            </div>
                        </div>
                    );
                },
            },
            {
                key: 'document',
                header: 'Documento',
                showInMobile: true,
                cell: (user) => (
                    <div className="flex items-center gap-1.5">
                        <IdCard
                            className="size-3.5 shrink-0 text-muted-foreground"
                            strokeWidth={2.25}
                        />
                        <span className="text-xs text-foreground/80">
                            {DOCUMENT_TYPE_LABELS[user.document_type]}{' '}
                            <span className="font-mono">
                                {user.document_number}
                            </span>
                        </span>
                    </div>
                ),
            },
            {
                key: 'phone',
                header: 'Teléfono',
                cell: (user) => (
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-foreground/80">
                        <Phone
                            className="size-3.5 shrink-0 text-muted-foreground"
                            strokeWidth={2.25}
                        />
                        {user.phone}
                    </span>
                ),
            },
            {
                key: 'role',
                header: 'Rol',
                cell: (user) => {
                    const isSuperadmin = user.role === 'superadmin';

                    return (
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck
                                className={
                                    isSuperadmin
                                        ? 'size-3.5 shrink-0 text-amber-600 dark:text-amber-400'
                                        : 'size-3.5 shrink-0 text-brand-gold-accent/80 dark:text-brand-gold/80'
                                }
                                strokeWidth={2.25}
                            />
                            <span className="text-xs">
                                {isSuperadmin ? 'Superadministrador' : 'Agente'}
                            </span>
                        </div>
                    );
                },
            },
            {
                key: 'post',
                header: 'Puesto',
                cell: (user) =>
                    user.post ? (
                        <div className="flex items-center gap-1.5">
                            <MapPin
                                className="size-3.5 shrink-0 text-muted-foreground"
                                strokeWidth={2.25}
                            />
                            <span className="text-xs text-foreground/80">
                                {user.post.name}
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs text-muted-foreground">
                            —
                        </span>
                    ),
            },
            {
                key: 'status',
                header: 'Estado',
                cell: (user) =>
                    user.is_active ? (
                        <StatBadge label="Activo" value="" variant="success" />
                    ) : (
                        <StatBadge
                            label="Suspendido"
                            value=""
                            variant="warning"
                        />
                    ),
            },
            {
                key: 'created_at',
                header: 'Creado',
                sortable: true,
                cell: (user) => (
                    <span className="text-xs text-muted-foreground">
                        {formatDate(user.created_at)}
                    </span>
                ),
            },
            {
                key: 'acciones',
                header: <span className="md:sr-only">Acciones</span>,
                align: 'right',
                cell: (user: User) => (
                    <div className="flex justify-end">
                        <UserRowActions
                            user={user}
                            currentUserId={currentUserId}
                            onEdit={openEdit}
                            onDelete={openDelete}
                        />
                    </div>
                ),
                className: 'w-12',
            },
        ];

        return base;
    }, [currentUserId, openEdit, openDelete]);

    return (
        <>
            <Head title="Usuarios" />

            <div className="flex flex-1 flex-col gap-5 p-4 sm:p-6">
                <PageHeader
                    title="Usuarios"
                    description="Gestiona las cuentas que pueden acceder al panel administrativo."
                    stats={[
                        {
                            label: 'Total',
                            value: stats.total,
                            variant: 'primary',
                            icon: UsersIcon,
                        },
                        {
                            label: 'Activos',
                            value: stats.activos,
                            variant: 'success',
                            icon: CheckCircle2,
                        },
                        {
                            label: 'Suspendidos',
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
                                </a>
                            </Button>
                            <Button
                                type="button"
                                onClick={openCreate}
                                className="cursor-pointer gap-2"
                            >
                                <Plus className="size-4" strokeWidth={2.5} />
                                <span className="hidden sm:inline">
                                    Nuevo usuario
                                </span>
                                <span className="sm:hidden">Nuevo</span>
                            </Button>
                        </div>
                    }
                />

                <DataTable
                    columns={columns}
                    data={paginated.data}
                    rowKey={(user) => user.id}
                    sort={sort}
                    onSortChange={setSort}
                    isLoading={isLoading}
                    selection={selection}
                    ariaLiveMessage={`${stats.coincidencias} usuarios encontrados`}
                    toolbar={
                        <DataToolbar
                            search={search}
                            onSearchChange={setSearch}
                            isSearching={isLoading}
                            placeholder="Buscar por nombre, usuario, documento o email…"
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
                            icon={activeFiltersCount > 0 ? Activity : Mail}
                            title={
                                activeFiltersCount > 0
                                    ? 'No hay coincidencias'
                                    : 'Todavía no hay usuarios'
                            }
                            description={
                                activeFiltersCount > 0
                                    ? 'Ajusta la búsqueda o los filtros para encontrar lo que buscas.'
                                    : 'Crea el primer usuario del panel administrativo.'
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
                                        Crear el primer usuario
                                    </Button>
                                ) : undefined
                            }
                        />
                    }
                />
            </div>

            <UserFormModal
                key={modal.type === 'edit' ? modal.user.id : 'create'}
                open={modal.type === 'create' || modal.type === 'edit'}
                onOpenChange={(open) => {
                    if (!open) {
                        closeModal();
                    }
                }}
                user={modal.type === 'edit' ? modal.user : null}
                rolesCatalog={roles_catalog}
                postsCatalog={posts_catalog}
            />

            <UserDeleteDialog
                open={modal.type === 'delete'}
                onOpenChange={(open) => {
                    if (!open) {
                        closeModal();
                    }
                }}
                user={modal.type === 'delete' ? modal.user : null}
                currentUserId={currentUserId}
            />

            <UserBulkDeleteDialog
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
                    singular: 'usuario seleccionado',
                    plural: 'usuarios seleccionados',
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
    breadcrumbs: [{ title: 'Usuarios', href: users.index() }],
};
