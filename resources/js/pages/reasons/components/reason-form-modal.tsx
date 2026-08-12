import { useForm } from '@inertiajs/react';
import { FileWarning, Loader2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { FormField, FormModal, FormSection } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import reasons from '@/routes/reasons';
import type { Reason } from '../types';

export type ReasonFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Motivo a editar; si es `null`, el modal abre en modo crear. */
    reason: Reason | null;
};

type ReasonFormData = {
    name: string;
    is_active: boolean;
};

const buildInitialData = (reason: Reason | null): ReasonFormData => ({
    name: reason?.name ?? '',
    is_active: reason?.is_active ?? true,
});

const isFormValid = (data: ReasonFormData): boolean =>
    data.name.trim().length >= 2;

/**
 * Modal de crear/editar Motivo.
 *
 * El padre debe montar este componente con un `key` distinto por
 * motivo (por ejemplo `reason?.id ?? 'create'`) para que el
 * formulario se reinicialice al cambiar de objetivo.
 */
export function ReasonFormModal({
    open,
    onOpenChange,
    reason,
}: ReasonFormModalProps) {
    const isEdit = reason !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors, isDirty } =
        useForm<ReasonFormData>(buildInitialData(reason));

    const canSubmit = isFormValid(data) && !processing;

    const confirmDiscard = (): boolean => {
        if (!isDirty) {
            return true;
        }

        return window.confirm(
            'Tienes cambios sin guardar. ¿Deseas descartarlos?',
        );
    };

    const handleClose = (next: boolean) => {
        if (!next) {
            if (!confirmDiscard()) {
                return;
            }

            reset();
            clearErrors();
        }

        onOpenChange(next);
    };

    const onSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const onSuccess = () => {
            reset();
            clearErrors();
            onOpenChange(false);
        };

        if (isEdit && reason) {
            put(reasons.update(reason.id).url, { preserveScroll: true, onSuccess });
        } else {
            post(reasons.store().url, { preserveScroll: true, onSuccess });
        }
    };

    return (
        <FormModal
            open={open}
            onOpenChange={handleClose}
            title={isEdit ? 'Editar motivo' : 'Nuevo motivo'}
            description={
                isEdit
                    ? 'Actualiza el nombre o estado de este motivo.'
                    : 'Crea un nuevo motivo de incidencia.'
            }
            size="sm"
            onSubmit={onSubmit}
            footer={
                <>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleClose(false)}
                        disabled={processing}
                        className="cursor-pointer"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="cursor-pointer gap-2 disabled:cursor-not-allowed"
                    >
                        {processing && (
                            <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                            />
                        )}
                        {isEdit ? 'Guardar cambios' : 'Crear motivo'}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-5">
                <FormSection
                    index={0}
                    icon={FileWarning}
                    title="Datos del motivo"
                    description="Nombre y estado del motivo de incidencia."
                    columns={1}
                >
                    <FormField
                        id="reason-name"
                        label="Nombre"
                        required
                        error={errors.name}
                    >
                        <Input
                            id="reason-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Intento de robo"
                            autoComplete="off"
                            autoFocus
                        />
                    </FormField>

                    <FormField
                        id="reason-is-active"
                        label="Estado"
                        hint="Un motivo inactivo no aparece en el formulario de incidencias."
                        error={errors.is_active}
                    >
                        <label
                            htmlFor="reason-is-active"
                            className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <Checkbox
                                id="reason-is-active"
                                checked={data.is_active}
                                onCheckedChange={(checked) =>
                                    setData('is_active', checked === true)
                                }
                            />
                            <span className="text-foreground/80">
                                {data.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                        </label>
                    </FormField>
                </FormSection>
            </div>
        </FormModal>
    );
}
