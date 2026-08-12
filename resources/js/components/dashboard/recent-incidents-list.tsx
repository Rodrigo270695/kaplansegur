import { Paperclip, ShieldAlert, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import type { DashboardIncident } from '@/pages/dashboard-types';

export type RecentIncidentsListProps = {
    incidents: DashboardIncident[];
    /** Si true, muestra la unidad/zonal/puesto de cada incidencia (solo superadmin). */
    showStructure?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
};

/** Lista compacta de incidencias recientes, reutilizada por ambos dashboards. */
export function RecentIncidentsList({
    incidents,
    showStructure = false,
    emptyTitle = 'Todo tranquilo por ahora',
    emptyDescription = 'No hay incidencias recientes que mostrar.',
}: RecentIncidentsListProps) {
    if (incidents.length === 0) {
        return (
            <div className="flex h-full min-h-[16rem] flex-1 flex-col items-center justify-center gap-3 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-brand-gold-soft dark:bg-brand-gold/10">
                    <ShieldCheck className="size-7 text-brand-gold-accent dark:text-brand-gold" />
                </div>
                <div className="space-y-1">
                    <p className="font-medium">{emptyTitle}</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                        {emptyDescription}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <ul className="flex flex-col divide-y divide-border/60">
            {incidents.map((incident) => {
                const post = incident.user?.post;
                const structureLabel = [
                    post?.unit_zone?.unit?.name,
                    post?.unit_zone?.zone?.name,
                    post?.name,
                ]
                    .filter(Boolean)
                    .join(' · ');

                return (
                    <li
                        key={incident.id}
                        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                    >
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-gold-soft text-brand-gold-accent dark:bg-brand-gold/10 dark:text-brand-gold">
                            <ShieldAlert className="size-4" strokeWidth={2.25} />
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                <span className="truncate text-sm font-semibold text-foreground">
                                    {incident.reason?.name ?? 'Sin motivo'}
                                </span>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                    {formatDateTime(incident.occurred_at)}
                                </span>
                            </div>
                            <p className="line-clamp-1 text-xs text-muted-foreground">
                                {incident.detail}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                                <span>
                                    {incident.user
                                        ? `${incident.user.name} ${incident.user.last_name}`
                                        : 'Reportante desconocido'}
                                </span>
                                {showStructure && structureLabel && (
                                    <span className="truncate">
                                        {structureLabel}
                                    </span>
                                )}
                                {incident.evidence_url && (
                                    <a
                                        href={incident.evidence_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1 font-medium text-brand-gold-accent hover:underline dark:text-brand-gold"
                                    >
                                        <Paperclip
                                            className="size-3"
                                            strokeWidth={2.25}
                                        />
                                        Evidencia
                                    </a>
                                )}
                            </div>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}
