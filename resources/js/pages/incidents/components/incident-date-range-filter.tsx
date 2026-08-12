import { CalendarIcon, Check, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type IncidentDateRangeFilterProps = {
    /** Inicio del rango aplicado (YYYY-MM-DD). */
    desde: string | null;
    /** Fin del rango aplicado (YYYY-MM-DD). */
    hasta: string | null;
    /** Rango por defecto al limpiar el filtro. */
    defaultDesde: string;
    defaultHasta: string;
    disabled?: boolean;
    onApply: (desde: string, hasta: string) => void;
    triggerClassName?: string;
};

type PresetId =
    | 'today'
    | 'yesterday'
    | 'this_week'
    | 'last_week'
    | 'this_month'
    | 'last_month'
    | 'this_year'
    | 'custom';

type PresetOption = {
    id: PresetId;
    label: string;
    desde: string;
    hasta: string;
    from: Date;
    to: Date;
};

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);

    return next;
}

function startOfWeek(date: Date): Date {
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    return addDays(startOfDay(date), diffToMonday);
}

function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 11, 31);
}

function toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
}

function formatDisplayDate(date: Date): string {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');

    return `${d}/${m}/${date.getFullYear()}`;
}

function parseIsoDate(value: string): Date | undefined {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return undefined;
    }

    const [y, m, d] = value.split('-').map(Number);

    if (!y || !m || !d) {
        return undefined;
    }

    const parsed = new Date(y, m - 1, d);

    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function formatRangeSpan(from: Date, to: Date): string {
    if (toIsoDate(from) === toIsoDate(to)) {
        return formatDisplayDate(from);
    }

    return `${formatDisplayDate(from)} — ${formatDisplayDate(to)}`;
}

function buildPresets(): PresetOption[] {
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = addDays(today, -1);
    const thisWeekStart = startOfWeek(now);
    const thisWeekEnd = addDays(thisWeekStart, 6);
    const lastWeekStart = addDays(thisWeekStart, -7);
    const lastWeekEnd = addDays(lastWeekStart, 6);
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = startOfMonth(lastMonthRef);
    const lastMonthEnd = endOfMonth(lastMonthRef);
    const thisYearStart = startOfYear(now);
    const thisYearEnd = endOfYear(now);

    const build = (id: PresetId, label: string, from: Date, to: Date): PresetOption => ({
        id,
        label,
        from,
        to,
        desde: toIsoDate(from),
        hasta: toIsoDate(to),
    });

    return [
        build('today', 'Hoy', today, today),
        build('yesterday', 'Ayer', yesterday, yesterday),
        build('this_week', 'Esta semana', thisWeekStart, thisWeekEnd),
        build('last_week', 'Semana pasada', lastWeekStart, lastWeekEnd),
        build('this_month', 'Este mes', thisMonthStart, thisMonthEnd),
        build('last_month', 'Mes anterior', lastMonthStart, lastMonthEnd),
        build('this_year', 'Este año', thisYearStart, thisYearEnd),
    ];
}

function detectPresetId(
    desde: string | null,
    hasta: string | null,
    presets: PresetOption[],
): PresetId {
    if (!desde || !hasta) {
        return 'custom';
    }

    return presets.find((p) => p.desde === desde && p.hasta === hasta)?.id ?? 'custom';
}

/**
 * Filtro de rango de fechas para Incidencias, con atajos (Hoy, Ayer,
 * Esta semana…) y un rango personalizado. Solo se muestra en el
 * frontend para el rol agente; el superadmin ve todo el histórico.
 */
export function IncidentDateRangeFilter({
    desde,
    hasta,
    defaultDesde,
    defaultHasta,
    disabled,
    onApply,
    triggerClassName,
}: IncidentDateRangeFilterProps) {
    const [open, setOpen] = useState(false);
    const [customOpen, setCustomOpen] = useState(false);
    const [customDesde, setCustomDesde] = useState('');
    const [customHasta, setCustomHasta] = useState('');

    const presets = useMemo(() => buildPresets(), []);

    const committedFrom = desde ? parseIsoDate(desde) : undefined;
    const committedTo = hasta ? parseIsoDate(hasta) : undefined;
    const hasRange = Boolean(desde && hasta);

    const activePresetId = detectPresetId(desde, hasta, presets);

    const triggerLabel =
        hasRange && committedFrom && committedTo
            ? formatRangeSpan(committedFrom, committedTo)
            : 'Todas las fechas';

    const applyRange = (fromIso: string, toIso: string) => {
        onApply(fromIso, toIso);
        setOpen(false);
    };

    const handleClear = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onApply(defaultDesde, defaultHasta);
        setOpen(false);
    };

    const handleOpenChange = (next: boolean) => {
        if (next) {
            setCustomDesde(desde ?? defaultDesde);
            setCustomHasta(hasta ?? defaultHasta);
            setCustomOpen(activePresetId === 'custom');
        }

        setOpen(next);
    };

    const canApplyCustom =
        /^\d{4}-\d{2}-\d{2}$/.test(customDesde) && /^\d{4}-\d{2}-\d{2}$/.test(customHasta);

    const applyCustom = () => {
        const from = parseIsoDate(customDesde);
        const to = parseIsoDate(customHasta);

        if (!from || !to) {
            return;
        }

        applyRange(
            toIsoDate(from <= to ? from : to),
            toIsoDate(from <= to ? to : from),
        );
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'h-9 min-w-[11rem] cursor-pointer justify-start gap-2 rounded-lg border-input bg-white px-2.5 font-normal shadow-xs transition-colors dark:bg-card',
                        hasRange
                            ? 'border-brand-gold/50 text-foreground hover:border-brand-gold hover:bg-white dark:border-brand-gold/40'
                            : 'text-muted-foreground hover:border-brand-gold/50 hover:bg-white',
                        triggerClassName,
                    )}
                    aria-label="Filtrar por rango de fechas"
                >
                    <CalendarIcon
                        className={cn(
                            'size-3.5 shrink-0',
                            hasRange
                                ? 'text-brand-gold-accent dark:text-brand-gold'
                                : 'opacity-60',
                        )}
                        aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-left text-sm">
                        {triggerLabel}
                    </span>
                    {hasRange ? (
                        <span
                            role="button"
                            tabIndex={0}
                            className="inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Quitar filtro de fechas"
                            onClick={handleClear}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleClear(e as unknown as MouseEvent);
                                }
                            }}
                        >
                            <X className="size-3.5" aria-hidden />
                        </span>
                    ) : null}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[min(100vw-2rem,15rem)] overflow-hidden rounded-xl border-border/70 p-0 shadow-lg"
                align="start"
                sideOffset={6}
            >
                <div className="flex flex-col p-1">
                    {presets.map((preset) => {
                        const isActive = activePresetId === preset.id;

                        return (
                            <button
                                key={preset.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => applyRange(preset.desde, preset.hasta)}
                                className={cn(
                                    'flex w-full cursor-pointer flex-col gap-0.5 rounded-lg px-2.5 py-1.5 text-left transition-colors',
                                    isActive
                                        ? 'border border-brand-gold/50 bg-brand-gold-soft text-brand-gold-accent dark:border-brand-gold/30 dark:bg-brand-gold/10 dark:text-brand-gold'
                                        : 'border border-transparent hover:bg-muted/60',
                                )}
                            >
                                <span
                                    className={cn(
                                        'text-sm',
                                        isActive
                                            ? 'font-semibold'
                                            : 'font-medium text-foreground',
                                    )}
                                >
                                    {preset.label}
                                </span>
                                <span
                                    className={cn(
                                        'text-[0.65rem] leading-tight tabular-nums',
                                        isActive
                                            ? 'text-brand-gold-accent/80 dark:text-brand-gold/80'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    {formatRangeSpan(preset.from, preset.to)}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="border-t border-border/60">
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setCustomOpen((v) => !v)}
                        className={cn(
                            'flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left transition-colors',
                            customOpen || activePresetId === 'custom'
                                ? 'bg-brand-gold-soft/70 dark:bg-brand-gold/10'
                                : 'hover:bg-muted/50',
                        )}
                    >
                        <span className="text-sm font-semibold text-foreground">
                            Personalizado
                        </span>
                        {customOpen || activePresetId === 'custom' ? (
                            <Check
                                className="size-3.5 text-brand-gold-accent dark:text-brand-gold"
                                aria-hidden
                            />
                        ) : null}
                    </button>

                    {customOpen ? (
                        <div className="space-y-3 border-t border-border/40 bg-muted/15 px-3 py-3">
                            <div className="grid grid-cols-2 gap-2.5">
                                <label className="flex flex-col gap-1">
                                    <span className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                                        Desde
                                    </span>
                                    <Input
                                        type="date"
                                        value={customDesde}
                                        disabled={disabled}
                                        onChange={(e) => setCustomDesde(e.target.value)}
                                        className="h-9 bg-card text-sm"
                                    />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="text-[0.65rem] font-semibold tracking-wide text-muted-foreground uppercase">
                                        Hasta
                                    </span>
                                    <Input
                                        type="date"
                                        value={customHasta}
                                        disabled={disabled}
                                        onChange={(e) => setCustomHasta(e.target.value)}
                                        className="h-9 bg-card text-sm"
                                    />
                                </label>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                disabled={disabled || !canApplyCustom}
                                className="h-9 w-full cursor-pointer rounded-md font-medium"
                                onClick={applyCustom}
                            >
                                Aplicar rango
                            </Button>
                        </div>
                    ) : null}
                </div>
            </PopoverContent>
        </Popover>
    );
}
