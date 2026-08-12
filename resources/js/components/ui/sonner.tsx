import { useFlashToast } from '@/hooks/use-flash-toast';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/**
 * Colores "rich" por tipo de toast, alineados con la paleta de marca
 * (dorado Kaplansegur) y con `StatBadge` para success/warning/error.
 * El sistema solo soporta modo claro.
 */
const richColorVars: Record<string, string> = {
    '--success-bg': '#ecfdf5',
    '--success-border': '#a7f3d0',
    '--success-text': '#065f46',
    '--warning-bg': '#fffbeb',
    '--warning-border': '#fde68a',
    '--warning-text': '#92400e',
    '--error-bg': '#fef2f2',
    '--error-border': '#fecaca',
    '--error-text': '#991b1b',
    '--info-bg': 'oklch(0.96 0.045 92)',
    '--info-border': 'oklch(0.8 0.173 88 / 45%)',
    '--info-text': 'oklch(0.5 0.14 76)',
};

function Toaster({ ...props }: ToasterProps) {
    useFlashToast();

    return (
        <Sonner
            theme="light"
            richColors
            className="toaster group"
            position="bottom-right"
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                    ...richColorVars,
                } as React.CSSProperties
            }
            toastOptions={{
                classNames: {
                    toast: 'shadow-lg font-medium',
                    icon: 'text-current',
                },
            }}
            {...props}
        />
    );
}

export { Toaster };
