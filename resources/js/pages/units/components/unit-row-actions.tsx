import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Unit } from '../types';

export type UnitRowActionsProps = {
    unit: Unit;
    onEdit: (unit: Unit) => void;
    onDelete: (unit: Unit) => void;
};

/** Dropdown de acciones por fila para unidades. */
export function UnitRowActions({
    unit,
    onEdit,
    onDelete,
}: UnitRowActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Acciones para ${unit.name}`}
                    className="size-8 cursor-pointer"
                >
                    <MoreHorizontal className="size-4" strokeWidth={2.5} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                    onSelect={() => onEdit(unit)}
                    className="cursor-pointer gap-2"
                >
                    <Pencil className="size-4" strokeWidth={2.25} />
                    Editar
                </DropdownMenuItem>

                <DropdownMenuItem
                    onSelect={() => onDelete(unit)}
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                >
                    <Trash2 className="size-4" strokeWidth={2.25} />
                    Eliminar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
