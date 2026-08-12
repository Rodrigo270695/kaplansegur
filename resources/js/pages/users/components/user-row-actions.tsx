import { Copy, Lock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toastManager } from '@/lib/toast';
import type { User } from '../types';

export type UserRowActionsProps = {
    user: User;
    /** ID del usuario autenticado, para mostrar el candado en su propia fila. */
    currentUserId: number | null;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
};

/**
 * Dropdown de acciones por fila para usuarios.
 *
 * "Editar" y "Eliminar" siempre están disponibles salvo que la fila sea
 * la propia cuenta del usuario logueado o una cuenta de superadministrador
 * (el backend rechaza ambos casos; esta es solo defensa en UI).
 */
export function UserRowActions({
    user,
    currentUserId,
    onEdit,
    onDelete,
}: UserRowActionsProps) {
    const isSelf = currentUserId === user.id;
    const isSuperadmin = user.role === 'superadmin';
    const showDelete = !isSelf && !isSuperadmin;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(user.email);
            toastManager.success({
                title: 'Email copiado',
                description: user.email,
                duration: 2000,
            });
        } catch {
            toastManager.error({ title: 'No se pudo copiar el email' });
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Acciones para ${user.name}`}
                    className="size-8 cursor-pointer"
                >
                    <MoreHorizontal className="size-4" strokeWidth={2.5} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                    onSelect={handleCopy}
                    className="cursor-pointer gap-2"
                >
                    <Copy className="size-4" strokeWidth={2.25} />
                    Copiar email
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onSelect={() => onEdit(user)}
                    className="cursor-pointer gap-2"
                >
                    <Pencil className="size-4" strokeWidth={2.25} />
                    Editar
                </DropdownMenuItem>

                {showDelete && (
                    <DropdownMenuItem
                        onSelect={() => onDelete(user)}
                        className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                    >
                        <Trash2 className="size-4" strokeWidth={2.25} />
                        Eliminar
                    </DropdownMenuItem>
                )}

                {(isSelf || isSuperadmin) && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            disabled
                            className="gap-2 text-xs text-muted-foreground"
                        >
                            <Lock className="size-3.5" strokeWidth={2.25} />
                            {isSelf
                                ? 'No puedes eliminar tu cuenta'
                                : 'Cuenta protegida'}
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
