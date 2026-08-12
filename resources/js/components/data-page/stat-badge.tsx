import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatBadgeVariant =
    'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

export type StatBadgeProps = {
    label: string;
    value: number | string;
    variant?: StatBadgeVariant;
    icon?: LucideIcon;
    className?: string;
};

const variantStyles: Record<StatBadgeVariant, string> = {
    default: 'bg-muted/60 text-foreground/80 ring-border/60 hover:bg-muted/80',
    primary:
        'bg-brand-gold-soft text-brand-gold-accent ring-brand-gold/25 hover:bg-brand-gold-soft/80 dark:bg-brand-gold/10 dark:text-brand-gold',
    success:
        'bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 hover:bg-emerald-500/15 dark:text-emerald-300',
    warning:
        'bg-amber-500/10 text-amber-800 ring-amber-500/25 hover:bg-amber-500/15 dark:text-amber-300',
    danger: 'bg-red-500/10 text-red-700 ring-red-500/25 hover:bg-red-500/15 dark:text-red-300',
    info: 'bg-sky-500/10 text-sky-700 ring-sky-500/25 hover:bg-sky-500/15 dark:text-sky-300',
    muted: 'bg-muted/40 text-muted-foreground ring-border/40',
};

/**
 * Badge informativo con icono + label + valor. Pensado para cabeceras
 * de páginas de listado (PageHeader) mostrando conteos: Total, Activos, etc.
 */
export function StatBadge({
    label,
    value,
    variant = 'default',
    icon: Icon,
    className,
}: StatBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors ring-inset',
                variantStyles[variant],
                className,
            )}
        >
            {Icon && <Icon className="size-3.5 shrink-0" strokeWidth={2.5} />}
            <span className="min-w-0 wrap-break-word">{label}</span>
            {value !== '' && value !== null && value !== undefined ? (
                <span className="shrink-0 font-semibold tabular-nums">
                    {value}
                </span>
            ) : null}
        </span>
    );
}
