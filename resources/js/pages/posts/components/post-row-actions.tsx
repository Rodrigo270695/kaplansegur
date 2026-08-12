import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Post } from '../types';

export type PostRowActionsProps = {
    post: Post;
    onEdit: (post: Post) => void;
    onDelete: (post: Post) => void;
};

/** Dropdown de acciones por fila para puestos. */
export function PostRowActions({
    post,
    onEdit,
    onDelete,
}: PostRowActionsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Acciones para ${post.name}`}
                    className="size-8 cursor-pointer"
                >
                    <MoreHorizontal className="size-4" strokeWidth={2.5} />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                    onSelect={() => onEdit(post)}
                    className="cursor-pointer gap-2"
                >
                    <Pencil className="size-4" strokeWidth={2.25} />
                    Editar
                </DropdownMenuItem>

                <DropdownMenuItem
                    onSelect={() => onDelete(post)}
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                >
                    <Trash2 className="size-4" strokeWidth={2.25} />
                    Eliminar
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
