import { useEffect } from 'react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { requestGeolocation } from '@/lib/geolocation';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    // Este layout es persistente (se monta una sola vez al iniciar
    // sesión, no en cada navegación interna): es el punto ideal para
    // pedir el permiso de geolocalización temprano, en vez de esperar
    // a que el agente abra "Nueva incidencia".
    useEffect(() => {
        requestGeolocation();
    }, []);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="h-svh overflow-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                <div className="flex-1 overflow-x-hidden overflow-y-auto">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
