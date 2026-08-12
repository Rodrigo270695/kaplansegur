import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type RowId = string | number;

export type RowSelectionState<TKey extends RowId = number> = {
    selectedIds: Set<TKey>;
    count: number;
    isAllSelected: boolean;
    isSomeSelected: boolean;
    toggle: (id: TKey) => void;
    toggleAll: () => void;
    clear: () => void;
    isSelected: (id: TKey) => boolean;
};

export type UseRowSelectionOptions<T, TKey extends RowId = number> = {
    /** Filas visibles actualmente (de la página actual). */
    rows: T[];
    rowKey: (row: T) => TKey;
    /**
     * Si true, la selección se mantiene al cambiar de página/filtro.
     * Default false: se limpia al cambiar el dataset, más predecible
     * para acciones masivas.
     */
    persistAcrossPages?: boolean;
};

/**
 * Selección de filas para tablas paginadas server-driven: toggle
 * individual, select-all tri-state y limpieza automática al cambiar
 * de página/filtros.
 */
export function useRowSelection<T, TKey extends RowId = number>({
    rows,
    rowKey,
    persistAcrossPages = false,
}: UseRowSelectionOptions<T, TKey>): RowSelectionState<TKey> {
    const [selectedIds, setSelectedIds] = useState<Set<TKey>>(
        () => new Set<TKey>(),
    );

    const visibleIds = useMemo(() => rows.map(rowKey), [rows, rowKey]);

    const lastRowsRef = useRef(rows);
    useEffect(() => {
        if (persistAcrossPages) {
            lastRowsRef.current = rows;

            return;
        }

        if (lastRowsRef.current !== rows) {
            setSelectedIds(new Set<TKey>());
            lastRowsRef.current = rows;
        }
    }, [rows, persistAcrossPages]);

    const isAllSelected = useMemo(() => {
        if (visibleIds.length === 0) {
            return false;
        }

        return visibleIds.every((id) => selectedIds.has(id));
    }, [visibleIds, selectedIds]);

    const isSomeSelected = useMemo(() => {
        if (visibleIds.length === 0 || isAllSelected) {
            return false;
        }

        return visibleIds.some((id) => selectedIds.has(id));
    }, [visibleIds, selectedIds, isAllSelected]);

    const toggle = useCallback((id: TKey) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        setSelectedIds((prev) => {
            const everyVisibleSelected = visibleIds.every((id) => prev.has(id));
            const next = new Set(prev);

            if (everyVisibleSelected) {
                visibleIds.forEach((id) => next.delete(id));
            } else {
                visibleIds.forEach((id) => next.add(id));
            }

            return next;
        });
    }, [visibleIds]);

    const clear = useCallback(() => setSelectedIds(new Set<TKey>()), []);

    const isSelected = useCallback(
        (id: TKey) => selectedIds.has(id),
        [selectedIds],
    );

    return {
        selectedIds,
        count: selectedIds.size,
        isAllSelected,
        isSomeSelected,
        toggle,
        toggleAll,
        clear,
        isSelected,
    };
}
