import { createInertiaApp } from '@inertiajs/react';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    layout: (name) => {
        switch (true) {
            case name === 'welcome':
            case name === 'auth/login':
                return null;
            case name.startsWith('auth/'):
                return AuthLayout;
            case name.startsWith('settings/'):
                return [AppLayout, SettingsLayout];
            default:
                return AppLayout;
        }
    },
    strictMode: true,
    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
                <PwaInstallPrompt />
            </TooltipProvider>
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// El sistema solo soporta modo claro; esto limpia cualquier clase
// "dark" que pudiera haber quedado de una sesión anterior.
initializeTheme();

// Registro del service worker (PWA): habilita "Instalar app" en
// navegadores compatibles. No cachea nada, ver public/sw.js.
// Guardado para SSR: "navigator"/"window" no existen en Node.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // Silencioso: si falla, la app sigue funcionando como sitio normal.
        });
    });
}
