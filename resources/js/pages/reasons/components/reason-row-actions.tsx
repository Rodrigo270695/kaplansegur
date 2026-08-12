import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Reason } from '../types';

export type ReasonRowActionsProps = {
    reason: Reason;
    onEdit: (reason: Reason) => void;
    onDelete: (reason: Reason) => void;
};

/** Dropdown de acciones por fila para motivos. */
export function ReasonRowActions({
    reason,
    onEdit,
    onDelete,
}: ReasonRowActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Acciones para ${reason.name}`}
                    className="size-8 cursor-pointer"
                >
                    <MoreHorizontal className="size-4" strokeWidth={2.5} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                    onSelect={() => onEdit(reason)}
                    className="cursor-pointer gap-2"
                >
                    <Pencil className="size-4" strokeWidth={2.25} />
                    Editar
                </DropdownMenuItem>

                <DropdownMenuItem
                    onSelect={() => onDelete(reason)}
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                >
                    <Trash2 className="size-4" strokeWidth={2.25} />
                    Eliminar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
