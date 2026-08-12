import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SortState } from '@/components/data-page';
import { toastManager } from '@/lib/toast';

/**
 * Filtros estándar que cualquier listado paginado server-driven entiende.
 * Se mapean 1:1 con un `LengthAwarePaginator` de Laravel y los query
 * params típicos (`search`, `per_page`, `sort`, `direction`).
 */
export type BaseFilters = {
    search: string;
    per_page: number;
    sort: string | null;
    direction: 'asc' | 'desc' | null;
};

export type UseDataTablePageOptions<
    TExtra extends Record<string, unknown> = Record<string, never>,
> = {
    /** URL del endpoint Inertia al que se hace `router.get`. */
    routeUrl: string;
    initialFilters: BaseFilters & TExtra;
    only?: string[];
    errorMessage?: string;
};

export type UseDataTablePageResult<
    TExtra extends Record<string, unknown> = Record<string, never>,
> = {
    search: string;
    setSearch: (value: string) => void;
    isLoading: boolean;
    sort: SortState | null;
    setSort: (sort: SortState | null) => void;
    perPage: number;
    setPerPage: (perPage: number) => void;
    applyFilter: (overrides: Partial<TExtra>) => void;
    fetch: (overrides?: Partial<BaseFilters & TExtra>) => void;
};

/**
 * Hook genérico para páginas de listado con tabla + filtros + paginación.
 *
 * Encapsula: búsqueda con debounce adaptativo, cambios de orden/`per_page`,
 * filtros adicionales arbitrarios, estado de loading y manejo de errores
 * con toast. Server-driven: el estado vive en la URL, el cliente solo
 * gestiona el input de búsqueda mientras el usuario escribe.
 */
export function useDataTablePage<
    TExtra extends Record<string, unknown> = Record<string, never>,
>(options: UseDataTablePageOptions<TExtra>): UseDataTablePageResult<TExtra> {
    const {
        routeUrl,
        initialFilters,
        only,
        errorMessage = 'No se pudo cargar la lista.',
    } = options;

    const [search, setSearch] = useState<string>(initialFilters?.search ?? '');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const currentSort: SortState | null =
        initialFilters?.sort && initialFilters?.direction
            ? { key: initialFilters.sort, direction: initialFilters.direction }
            : null;

    const filtersRef = useRef(initialFilters);
    useEffect(() => {
        filtersRef.current = initialFilters;
    }, [initialFilters]);

    const fetch = useCallback(
        (overrides: Partial<BaseFilters & TExtra> = {}) => {
            setIsLoading(true);

            const current = filtersRef.current;
            const merged: Record<string, unknown> = {
                ...current,
                ...overrides,
                page: 1,
            };

            const cleaned = Object.fromEntries(
                Object.entries(merged).filter(([, value]) => {
                    if (value === undefined || value === null) {
                        return false;
                    }

                    if (typeof value === 'string' && value.length === 0) {
                        return false;
                    }

                    return true;
                }),
            );

            router.get(
                routeUrl,
                cleaned as Record<string, string | number | boolean>,
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                    only,
                    onError: () => toastManager.error({ title: errorMessage }),
                    onFinish: () => setIsLoading(false),
                },
            );
        },
        [routeUrl, only, errorMessage],
    );

    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;

            return;
        }

        if (search === (filtersRef.current?.search ?? '')) {
            return;
        }

        const trimmed = search.trim();
        let delay = 500;

        if (trimmed.length === 0) {
            delay = 300;
        } else if (trimmed.length === 1) {
            delay = 800;
        }

        const timer = window.setTimeout(() => {
            fetch({ search: trimmed } as Partial<BaseFilters & TExtra>);
        }, delay);

        return () => window.clearTimeout(timer);
    }, [search, fetch]);

    const setSort = useCallback(
        (sort: SortState | null) => {
            fetch({
                sort: sort?.key ?? null,
                direction: sort?.direction ?? null,
            } as Partial<BaseFilters & TExtra>);
        },
        [fetch],
    );

    const setPerPage = useCallback(
        (perPage: number) => {
            fetch({ per_page: perPage } as Partial<BaseFilters & TExtra>);
        },
        [fetch],
    );

    const applyFilter = useCallback(
        (overrides: Partial<TExtra>) => {
            fetch(overrides as Partial<BaseFilters & TExtra>);
        },
        [fetch],
    );

    return {
        search,
        setSearch,
        isLoading,
        sort: currentSort,
        setSort,
        perPage: initialFilters.per_page,
        setPerPage,
        applyFilter,
        fetch,
    };
}
