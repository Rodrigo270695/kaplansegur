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
import posts from '@/routes/posts';
import type { Post } from '../types';

export type PostDeleteDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    post: Post | null;
};

/**
 * Diálogo de confirmación para eliminar un puesto.
 *
 * El backend rechaza la eliminación si el puesto tiene usuarios
 * asignados; el mensaje de error llega como toast.
 */
export function PostDeleteDialog({
    open,
    onOpenChange,
    post,
}: PostDeleteDialogProps) {
    const [processing, setProcessing] = useState(false);

    const onConfirm = () => {
        if (!post) {
            return;
        }

        setProcessing(true);
        router.delete(posts.destroy(post.id).url, {
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
                        Eliminar puesto
                    </DialogTitle>
                    <DialogDescription className="text-sm" asChild>
                        <p>
                            Vas a eliminar{' '}
                            <strong className="text-foreground">
                                {post?.name}
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
