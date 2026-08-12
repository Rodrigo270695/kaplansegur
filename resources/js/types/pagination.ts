/**
 * Forma estándar del JSON que produce `LengthAwarePaginator::paginate()`
 * de Laravel al pasar por Inertia. `T` es el tipo de cada elemento de `data`.
 */
export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    path: string;
    prev_page_url: string | null;
    next_page_url: string | null;
};
