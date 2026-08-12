import { router } from '@inertiajs/react';
import { Loader2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import incidents from '@/routes/incidents';
import type { Incident } from '../types';

export type IncidentDeleteDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    incident: Incident | null;
};

/** Diálogo de confirmación para eliminar una incidencia. */
export function IncidentDeleteDialog({
    open,
    onOpenChange,
    incident,
}: IncidentDeleteDialogProps) {
    const [processing, setProcessing] = useState(false);

    const onConfirm = () => {
        if (!incident) {
            return;
        }

        setProcessing(true);
        router.delete(incidents.destroy(incident.id).url, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <TriangleAlert
                            className="size-5"
                            strokeWidth={2.5}
                            aria-hidden="true"
                        />
                    </div>
                    <DialogTitle className="pt-2 text-base">
                        Eliminar incidencia
                    </DialogTitle>
                    <DialogDescription className="text-sm" asChild>
                        <p>
                            Vas a eliminar la incidencia de{' '}
                            <strong className="text-foreground">
                                {incident?.reason?.name ?? 'motivo desconocido'}
                            </strong>
                            . Esta acción no se puede deshacer.
                        </p>
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={processing}
                        className="cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={processing}
                        className="cursor-pointer gap-2"
                    >
                        {processing && (
                            <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                            />
                        )}
                        {processing ? 'Eliminando…' : 'Eliminar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
