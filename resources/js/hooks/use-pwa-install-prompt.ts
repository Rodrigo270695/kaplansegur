import { useCallback, useEffect, useState } from 'react';

/**
 * Aviso de instalación de la PWA (ver `resources/js/components/pwa-install-prompt.tsx`).
 *
 * Solo debe aparecer una vez por dispositivo/navegador, y nunca si la
 * app ya está instalada. La plataforma determina cómo se puede
 * instalar:
 * - Android / Chrome / Edge (desktop): el navegador dispara
 *   `beforeinstallprompt`; ese evento se guarda y se dispara con
 *   `promptInstall()` cuando el usuario acepta.
 * - iOS / iPadOS (Safari no soporta `beforeinstallprompt`): no hay
 *   forma programática de instalar, solo se muestran instrucciones
 *   ("Compartir" → "Agregar a pantalla de inicio").
 * - Cualquier otro navegador sin soporte: no se muestra nada.
 */

const STORAGE_KEY = 'kaplansegur:pwa-install-prompt-dismissed';
const SHOW_DELAY_MS = 2500;

type Platform = 'android' | 'ios' | 'desktop';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const hasSeenPrompt = (): boolean => {
    try {
        return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
        return false;
    }
};

const markPromptAsSeen = (): void => {
    try {
        window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
        // Almacenamiento no disponible (modo privado, etc.): no es crítico.
    }
};

const isStandaloneDisplay = (): boolean =>
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

const detectIos = (): boolean =>
    /iphone|ipad|ipod/i.test(window.navigator.userAgent) &&
    !('MSStream' in window);

const detectAndroid = (): boolean =>
    /android/i.test(window.navigator.userAgent);

export type UsePwaInstallPromptResult = {
    visible: boolean;
    platform: Platform | null;
    canPromptInstall: boolean;
    promptInstall: () => Promise<void>;
    dismiss: () => void;
};

export function usePwaInstallPrompt(): UsePwaInstallPromptResult {
    const [visible, setVisible] = useState(false);
    const [platform, setPlatform] = useState<Platform | null>(null);
    const [deferredEvent, setDeferredEvent] =
        useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        if (typeof window === 'undefined' || hasSeenPrompt()) {
            return;
        }

        if (isStandaloneDisplay()) {
            markPromptAsSeen();

            return;
        }

        let timer: ReturnType<typeof setTimeout> | undefined;

        const showWithDelay = (nextPlatform: Platform) => {
            timer = setTimeout(() => {
                setPlatform(nextPlatform);
                setVisible(true);
            }, SHOW_DELAY_MS);
        };

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredEvent(event as BeforeInstallPromptEvent);
            showWithDelay(detectAndroid() ? 'android' : 'desktop');
        };

        const handleAppInstalled = () => {
            markPromptAsSeen();
            setVisible(false);
        };

        window.addEventListener(
            'beforeinstallprompt',
            handleBeforeInstallPrompt,
        );
        window.addEventListener('appinstalled', handleAppInstalled);

        if (detectIos()) {
            showWithDelay('ios');
        }

        return () => {
            window.removeEventListener(
                'beforeinstallprompt',
                handleBeforeInstallPrompt,
            );
            window.removeEventListener('appinstalled', handleAppInstalled);

            if (timer) {
                clearTimeout(timer);
            }
        };
    }, []);

    const dismiss = useCallback(() => {
        markPromptAsSeen();
        setVisible(false);
    }, []);

    const promptInstall = useCallback(async () => {
        if (!deferredEvent) {
            return;
        }

        await deferredEvent.prompt();
        await deferredEvent.userChoice;

        markPromptAsSeen();
        setVisible(false);
        setDeferredEvent(null);
    }, [deferredEvent]);

    return {
        visible,
        platform,
        canPromptInstall: deferredEvent !== null,
        promptInstall,
        dismiss,
    };
}
