import { toast } from 'sonner';

export type ToastType =
    'default' | 'success' | 'error' | 'info' | 'warning' | 'loading';

export type ToastAction = {
    label: string;
    onClick: () => void;
};

export type ToastOptions = {
    /** Identificador estable: si ya existe se actualiza en lugar de apilarse. */
    id?: string | number;
    type?: ToastType;
    title: string;
    description?: string;
    action?: ToastAction;
    /** Duración en ms. Usa `Infinity` para que no se cierre solo. */
    duration?: number;
    onDismiss?: () => void;
};

function buildSonnerOptions(opts: ToastOptions) {
    return {
        id: opts.id,
        description: opts.description,
        duration: opts.duration,
        onDismiss: opts.onDismiss,
        action: opts.action
            ? { label: opts.action.label, onClick: opts.action.onClick }
            : undefined,
    };
}

/**
 * Envoltorio delgado sobre `sonner` con una API consistente en toda la app:
 * `toastManager.success({ title, description })`.
 */
export const toastManager = {
    add(opts: ToastOptions): string | number {
        const sonnerOpts = buildSonnerOptions(opts);

        switch (opts.type) {
            case 'success':
                return toast.success(opts.title, sonnerOpts);
            case 'error':
                return toast.error(opts.title, sonnerOpts);
            case 'info':
                return toast.info(opts.title, sonnerOpts);
            case 'warning':
                return toast.warning(opts.title, sonnerOpts);
            case 'loading':
                return toast.loading(opts.title, sonnerOpts);
            default:
                return toast(opts.title, sonnerOpts);
        }
    },
    success(opts: Omit<ToastOptions, 'type'>) {
        return this.add({ ...opts, type: 'success' });
    },
    error(opts: Omit<ToastOptions, 'type'>) {
        return this.add({ ...opts, type: 'error' });
    },
    info(opts: Omit<ToastOptions, 'type'>) {
        return this.add({ ...opts, type: 'info' });
    },
    warning(opts: Omit<ToastOptions, 'type'>) {
        return this.add({ ...opts, type: 'warning' });
    },
    dismissAll() {
        toast.dismiss();
    },
};
