import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Incident } from '../types';

export type IncidentRowActionsProps = {
    incident: Incident;
    /** Si es false (agente sobre una incidencia que no le pertenece), no se muestran acciones. */
    canManage: boolean;
    onEdit: (incident: Incident) => void;
    onDelete: (incident: Incident) => void;
};

/** Dropdown de acciones por fila para incidencias. */
export function IncidentRowActions({
    incident,
    canManage,
    onEdit,
    onDelete,
}: IncidentRowActionsProps) {
    if (!canManage) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Acciones para la incidencia #${incident.id}`}
                    className="size-8 cursor-pointer"
                >
                    <MoreHorizontal className="size-4" strokeWidth={2.5} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                    onSelect={() => onEdit(incident)}
                    className="cursor-pointer gap-2"
                >
                    <Pencil className="size-4" strokeWidth={2.25} />
                    Editar
                </DropdownMenuItem>

                <DropdownMenuItem
                    onSelect={() => onDelete(incident)}
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                >
                    <Trash2 className="size-4" strokeWidth={2.25} />
                    Eliminar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
