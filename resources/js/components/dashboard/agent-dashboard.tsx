import { Link, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    ClipboardList,
    Plus,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AgentDashboardProps } from '@/pages/dashboard-types';
import incidents from '@/routes/incidents';
import { RecentIncidentsList } from './recent-incidents-list';

/** Dashboard del agente: acotado a su propio puesto y a sus reportes. */
export function AgentDashboard({
    post_name: postName,
    stats,
    recent_incidents: recentIncidents,
}: Omit<AgentDashboardProps, 'role'>) {
    const { name } = usePage().props;

    const cards = [
        {
            title: 'Incidencias de mi puesto hoy',
            value: stats.post_incidents_today,
            description: postName
                ? `Reportadas en ${postName}`
                : 'Reportadas en tu puesto',
            icon: ShieldAlert,
        },
        {
            title: 'Incidencias de mi puesto',
            value: stats.post_incidents_total,
            description: 'Total histórico de tu puesto',
            icon: ShieldCheck,
        },
        {
            title: 'Mis reportes hoy',
            value: stats.my_incidents_today,
            description: 'Incidencias que registraste hoy',
            icon: CalendarClock,
        },
        {
            title: 'Mis reportes',
            value: stats.my_incidents_total,
            description: 'Total histórico de tus reportes',
            icon: ClipboardList,
        },
    ];

    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Bienvenido de nuevo
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Panel de control de {name}
                        {postName ? ` · ${postName}` : ''}. Aquí verás el
                        estado de tu puesto.
                    </p>
                </div>

                <Button asChild className="cursor-pointer gap-2 sm:self-start">
                    <Link href={incidents.index()}>
                        <Plus className="size-4" strokeWidth={2.5} />
                        Nueva incidencia
                    </Link>
                </Button>
            </div>

            {!postName && (
                <div className="rounded-lg border border-dashed border-amber-400/60 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200">
                    Todavía no tienes un puesto asignado. Contacta a un
                    superadministrador para que te asigne uno.
                </div>
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
                        Incidencias recientes de tu puesto
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex h-full min-h-[50vh] flex-1 flex-col">
                    <RecentIncidentsList
                        incidents={recentIncidents}
                        emptyDescription="No hay incidencias registradas en tu puesto todavía."
                    />
                </CardContent>
            </Card>
        </div>
    );
}
