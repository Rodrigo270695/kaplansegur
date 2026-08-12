import { Download, Share2, SquarePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePwaInstallPrompt } from '@/hooks/use-pwa-install-prompt';

/**
 * Aviso flotante (arriba a la derecha) que invita a instalar la PWA.
 * Aparece una sola vez por dispositivo/navegador, la primera vez que
 * alguien visita el sitio sin tenerla instalada (ver
 * `use-pwa-install-prompt.ts` para el detalle de cuándo se muestra).
 */
export function PwaInstallPrompt() {
    const { visible, platform, canPromptInstall, promptInstall, dismiss } =
        usePwaInstallPrompt();

    if (!visible || !platform) {
        return null;
    }

    return (
        <div
            role="dialog"
            aria-live="polite"
            aria-label="Instalar la aplicación"
            className="fixed top-4 right-4 z-100 w-[min(22rem,calc(100vw-2rem))] animate-in rounded-xl border border-brand-gold/30 bg-card p-4 shadow-2xl fade-in slide-in-from-top-4 dark:border-brand-gold/20"
        >
            <button
                type="button"
                onClick={dismiss}
                aria-label="Cerrar aviso"
                className="absolute top-2.5 right-2.5 cursor-pointer rounded-full p-1 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
                <X className="size-3.5" strokeWidth={2.5} />
            </button>

            <div className="flex items-start gap-3 pr-4">
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-black">
                    <img
                        src="/icons/icon-72x72.png"
                        alt="Kaplansegur"
                        className="size-7 object-contain"
                    />
                </span>

                <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-sm font-semibold text-foreground">
                        Instala Kaplansegur
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                        {platform === 'ios'
                            ? 'Agrégala a tu pantalla de inicio para abrirla más rápido, como una app.'
                            : 'Instálala en tu dispositivo para acceso rápido, incluso desde el ícono de tu pantalla de inicio.'}
                    </p>
                </div>
            </div>

            {platform === 'ios' ? (
                <div className="mt-3 space-y-1.5 rounded-lg bg-brand-gold-soft/60 p-2.5 text-xs text-foreground/80 dark:bg-brand-gold/10">
                    <div className="flex items-center gap-2">
                        <Share2
                            className="size-3.5 shrink-0 text-brand-gold-accent dark:text-brand-gold"
                            strokeWidth={2.25}
                        />
                        <span>
                            Toca el botón{' '}
                            <span className="font-medium">Compartir</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <SquarePlus
                            className="size-3.5 shrink-0 text-brand-gold-accent dark:text-brand-gold"
                            strokeWidth={2.25}
                        />
                        <span>
                            Elige{' '}
                            <span className="font-medium">
                                Agregar a pantalla de inicio
                            </span>
                        </span>
                    </div>
                </div>
            ) : null}

            <div className="mt-3 flex justify-end gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={dismiss}
                    className="cursor-pointer"
                >
                    Ahora no
                </Button>

                {platform !== 'ios' && canPromptInstall && (
                    <Button
                        type="button"
                        size="sm"
                        onClick={promptInstall}
                        className="cursor-pointer gap-1.5"
                    >
                        <Download className="size-3.5" strokeWidth={2.5} />
                        Instalar
                    </Button>
                )}
            </div>
        </div>
    );
}
