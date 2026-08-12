import { router } from '@inertiajs/react';
import { Loader2, Lock, TriangleAlert } from 'lucide-react';
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
import users from '@/routes/users';
import type { User } from '../types';

export type UserDeleteDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: User | null;
    /** ID del usuario autenticado: bloquea el self-delete. */
    currentUserId: number | null;
};

/**
 * Diálogo de confirmación para eliminar un usuario.
 *
 * Si la cuenta a eliminar es la propia o un superadministrador, se
 * informa el motivo y no se renderiza el botón de eliminar (el backend
 * también lo rechaza; esta es defensa en UI).
 */
export function UserDeleteDialog({
    open,
    onOpenChange,
    user,
    currentUserId,
}: UserDeleteDialogProps) {
    const [processing, setProcessing] = useState(false);

    const isSelf = user !== null && currentUserId === user.id;
    const isSuperadmin = user !== null && user.role === 'superadmin';
    const isProtected = isSelf || isSuperadmin;

    const onConfirm = () => {
        if (!user || isProtected) {
            return;
        }

        setProcessing(true);
        router.delete(users.destroy(user.id).url, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => onOpenChange(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div
                        className={
                            isProtected
                                ? 'flex size-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                : 'flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive'
                        }
                    >
                        {isProtected ? (
                            <Lock
                                className="size-5"
                                strokeWidth={2.5}
                                aria-hidden="true"
                            />
                        ) : (
                            <TriangleAlert
                                className="size-5"
                                strokeWidth={2.5}
                                aria-hidden="true"
                            />
                        )}
                    </div>
                    <DialogTitle className="pt-2 text-base">
                        Eliminar usuario
                    </DialogTitle>
                    <DialogDescription className="text-sm" asChild>
                        {isProtected ? (
                            <p>
                                {isSelf
                                    ? 'No puedes eliminar tu propia cuenta.'
                                    : 'No se puede eliminar una cuenta de superadministrador.'}
                            </p>
                        ) : (
                            <p>
                                Vas a eliminar a{' '}
                                <strong className="text-foreground">
                                    {user?.name} {user?.last_name}
                                </strong>
                                . Esta acción no se puede deshacer.
                            </p>
                        )}
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
                    {!isProtected && (
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
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
