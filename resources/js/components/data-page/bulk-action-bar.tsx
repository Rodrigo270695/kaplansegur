import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type BulkActionBarProps = {
    count: number;
    /**
     * Etiqueta en singular y plural. NO incluyas el número: la barra ya
     * renderiza el contador en su propio badge a la izquierda.
     */
    labels?: {
        singular: string;
        plural: string;
    };
    onClear: () => void;
    children: ReactNode;
    className?: string;
};

/**
 * Barra flotante que aparece cuando hay filas seleccionadas en una tabla.
 */
export function BulkActionBar({
    count,
    labels = { singular: 'seleccionado', plural: 'seleccionados' },
    onClear,
    children,
    className,
}: BulkActionBarProps) {
    if (count === 0) {
        return null;
    }

    return (
        <div
            role="region"
            aria-label="Acciones para filas seleccionadas"
            className={cn(
                'fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-border/70 bg-card/95 p-2 shadow-xl ring-1 ring-brand-gold/15 backdrop-blur-md',
                'animate-in duration-300 fade-in slide-in-from-bottom-4',
                'sm:bottom-6',
                className,
            )}
        >
            <button
                type="button"
                onClick={onClear}
                aria-label="Limpiar selección"
                className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
                <X className="size-4" strokeWidth={2.25} />
            </button>

            <div className="flex flex-1 items-center gap-2 px-1">
                <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-brand-gold-soft px-2 text-xs font-semibold text-brand-gold-accent tabular-nums dark:bg-brand-gold/10 dark:text-brand-gold">
                    {count}
                </span>
                <span className="text-xs font-medium text-foreground sm:text-sm">
                    {count === 1 ? labels.singular : labels.plural}
                </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">{children}</div>
        </div>
    );
}

/**
 * Botón "default" dentro de la BulkActionBar para consistencia visual.
 * Acepta todas las props de Button.
 */
export const BulkAction = Button;
