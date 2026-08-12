import { useForm } from '@inertiajs/react';
import { Loader2, MapPinned } from 'lucide-react';
import type { FormEvent } from 'react';
import { FormField, FormModal, FormSection } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import zones from '@/routes/zones';
import type { Zone } from '../types';

export type ZoneFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Zonal a editar; si es `null`, el modal abre en modo crear. */
    zone: Zone | null;
};

type ZoneFormData = {
    name: string;
    description: string;
    is_active: boolean;
};

const buildInitialData = (zone: Zone | null): ZoneFormData => ({
    name: zone?.name ?? '',
    description: zone?.description ?? '',
    is_active: zone?.is_active ?? true,
});

const isFormValid = (data: ZoneFormData): boolean =>
    data.name.trim().length >= 2;

/**
 * Modal de crear/editar Zonal.
 *
 * El padre debe montar este componente con un `key` distinto por
 * zonal (por ejemplo `zone?.id ?? 'create'`) para que el formulario
 * se reinicialice al cambiar de objetivo.
 */
export function ZoneFormModal({
    open,
    onOpenChange,
    zone,
}: ZoneFormModalProps) {
    const isEdit = zone !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors, isDirty } =
        useForm<ZoneFormData>(buildInitialData(zone));

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

        if (isEdit && zone) {
            put(zones.update(zone.id).url, { preserveScroll: true, onSuccess });
        } else {
            post(zones.store().url, { preserveScroll: true, onSuccess });
        }
    };

    return (
        <FormModal
            open={open}
            onOpenChange={handleClose}
            title={isEdit ? 'Editar zonal' : 'Nuevo zonal'}
            description={
                isEdit
                    ? 'Actualiza los datos de este zonal.'
                    : 'Crea un nuevo zonal de operación.'
            }
            size="md"
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
                        {isEdit ? 'Guardar cambios' : 'Crear zonal'}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-5">
                <FormSection
                    index={0}
                    icon={MapPinned}
                    title="Datos del zonal"
                    description="Nombre y descripción del área de operación."
                    columns={1}
                >
                    <FormField
                        id="zone-name"
                        label="Nombre"
                        required
                        error={errors.name}
                    >
                        <Input
                            id="zone-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Zonal Lima Norte"
                            autoComplete="off"
                            autoFocus
                        />
                    </FormField>

                    <FormField
                        id="zone-description"
                        label="Descripción"
                        error={errors.description}
                    >
                        <Textarea
                            id="zone-description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder="Detalle del área que cubre este zonal…"
                            rows={3}
                        />
                    </FormField>

                    <FormField
                        id="zone-is-active"
                        label="Estado"
                        hint="Un zonal inactivo no aparece en los catálogos de asignación."
                        error={errors.is_active}
                    >
                        <label
                            htmlFor="zone-is-active"
                            className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <Checkbox
                                id="zone-is-active"
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
