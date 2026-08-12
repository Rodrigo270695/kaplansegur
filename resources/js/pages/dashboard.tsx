import { Head } from '@inertiajs/react';
import { AgentDashboard } from '@/components/dashboard/agent-dashboard';
import { SuperAdminDashboard } from '@/components/dashboard/superadmin-dashboard';
import { dashboard } from '@/routes';
import type { DashboardPageProps } from './dashboard-types';

/**
 * El sistema tiene dos dashboards completamente distintos según el
 * rol (ver `DashboardController`): superadmin ve el panorama global
 * de la operación; agente ve solo su puesto y sus propios reportes.
 */
export default function Dashboard(props: DashboardPageProps) {
    return (
        <>
            <Head title="Dashboard" />
            {props.role === 'superadmin' ? (
                <SuperAdminDashboard {...props} />
            ) : (
                <AgentDashboard {...props} />
            )}
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
