import { Link, usePage } from '@inertiajs/react';
import {
    Building2,
    ClipboardList,
    MapPinned,
    Paperclip,
    ShieldAlert,
    Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SuperAdminDashboardProps } from '@/pages/dashboard-types';
import incidents from '@/routes/incidents';
import { RecentIncidentsList } from './recent-incidents-list';

/** Dashboard del superadmin: panorama global de toda la operación. */
export function SuperAdminDashboard({
    units,
    stats,
    recent_incidents: recentIncidents,
}: Omit<SuperAdminDashboardProps, 'role'>) {
    const { name } = usePage().props;

    const cards = [
        {
            title: 'Incidencias hoy',
            value: stats.incidents_today,
            description: 'Reportadas en las últimas 24 horas',
            icon: ShieldAlert,
        },
        {
            title: 'Incidencias totales',
            value: stats.incidents_total,
            description: `${stats.incidents_with_evidence} con evidencia adjunta`,
            icon: Paperclip,
        },
        {
            title: 'Usuarios activos',
            value: stats.users,
            description: 'Superadministradores y agentes',
            icon: Users,
        },
        {
            title: 'Puestos activos',
            value: stats.posts,
            description: `${stats.units} unidades · ${stats.zones} zonales`,
            icon: MapPinned,
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
            <div>
                <h1 className="text-xl font-semibold tracking-tight">
                    Bienvenido de nuevo
                </h1>
                <p className="text-sm text-muted-foreground">
                    Panel de control de {name}. Aquí verás el estado global de
                    tus operaciones de seguridad.
                </p>
            </div>

            {units.length > 0 && (
                <Card className="border-border/60 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Building2 className="size-4 text-brand-gold-accent dark:text-brand-gold" />
                            Unidades
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {units.map((unit) => (
                                <Link
                                    key={unit.id}
                                    href={
                                        incidents.index({
                                            query: { unit_id: unit.id },
                                        }).url
                                    }
                                    className="group relative flex aspect-square flex-col justify-end overflow-hidden rounded-2xl border border-border/60 bg-brand-black shadow-sm transition-all hover:shadow-lg hover:ring-2 hover:ring-brand-gold/50"
                                >
                                    {unit.photo_url ? (
                                        <img
                                            src={unit.photo_url}
                                            alt={unit.name}
                                            className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-brand-gold-soft dark:bg-brand-gold/10">
                                            <Building2
                                                className="size-12 text-brand-gold-accent dark:text-brand-gold"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                    )}
                                    <div
                                        aria-hidden
                                        className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent"
                                    />
                                    <span className="relative z-10 truncate p-3 text-sm font-semibold text-white">
                                        {unit.name}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((stat) => (
                    <Card key={stat.title} className="border-border/60 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between pb-0">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <div className="flex size-9 items-center justify-center rounded-lg bg-brand-gold-soft text-brand-gold-accent dark:bg-brand-gold/10 dark:text-brand-gold">
                                <stat.icon className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold tracking-tight">
                                {stat.value}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="relative flex-1 overflow-hidden border-border/60 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ClipboardList className="size-4 text-brand-gold-accent dark:text-brand-gold" />
                        Incidencias recientes
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex h-full min-h-[50vh] flex-1 flex-col">
                    <RecentIncidentsList
                        incidents={recentIncidents}
                        showStructure
                        emptyDescription="No hay incidencias registradas en ningún puesto todavía."
                    />
                </CardContent>
            </Card>
        </div>
    );
}
