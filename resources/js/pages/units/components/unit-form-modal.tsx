import { useForm } from '@inertiajs/react';
import { Building2, ImagePlus, Loader2, MapPinned, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import type { FormEvent } from 'react';
import { FormField, FormModal, FormSection } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import units from '@/routes/units';
import type { Unit, ZoneOption } from '../types';

export type UnitFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Unidad a editar; si es `null`, el modal abre en modo crear. */
    unit: Unit | null;
    /** Catálogo de zonales disponibles para asignar a la unidad. */
    zonesCatalog: readonly ZoneOption[];
};

type UnitFormData = {
    name: string;
    description: string;
    photo: File | null;
    is_active: boolean;
    zone_ids: number[];
};

const buildInitialData = (unit: Unit | null): UnitFormData => ({
    name: unit?.name ?? '',
    description: unit?.description ?? '',
    photo: null,
    is_active: unit?.is_active ?? true,
    zone_ids: unit?.zones?.map((zone) => zone.id) ?? [],
});

const isFormValid = (data: UnitFormData): boolean =>
    data.name.trim().length >= 2;

/**
 * Modal de crear/editar Unidad.
 *
 * Incluye la foto de la unidad (subida como archivo) y el multi-select
 * de Zonales asignadas: la sincronización de la tabla intermedia
 * `unit_zones` la resuelve el backend a partir de `zone_ids`, sin
 * desvincular ninguna combinación que ya tenga Puestos creados.
 *
 * El padre debe montar este componente con un `key` distinto por
 * unidad (por ejemplo `unit?.id ?? 'create'`) para que el formulario
 * se reinicialice al cambiar de objetivo.
 */
export function UnitFormModal({
    open,
    onOpenChange,
    unit,
    zonesCatalog,
}: UnitFormModalProps) {
    const isEdit = unit !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors, isDirty } =
        useForm<UnitFormData>(buildInitialData(unit));

    const canSubmit = isFormValid(data) && !processing;

    // El object URL solo se crea/revoca cuando cambia el archivo
    // seleccionado; si no hay uno nuevo, se muestra la foto ya guardada.
    const objectUrl = useMemo(
        () => (data.photo ? URL.createObjectURL(data.photo) : null),
        [data.photo],
    );

    useEffect(() => {
        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [objectUrl]);

    const previewUrl = objectUrl ?? unit?.photo_url ?? null;

    const toggleZone = (zoneId: number) => {
        setData(
            'zone_ids',
            data.zone_ids.includes(zoneId)
                ? data.zone_ids.filter((id) => id !== zoneId)
                : [...data.zone_ids, zoneId],
        );
    };

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

        // Al haber un archivo en `data`, Inertia envía automáticamente
        // un POST con `_method` spoofeado (los navegadores no soportan
        // PUT/PATCH multipart), así que `put()` funciona igual en edición.
        if (isEdit && unit) {
            put(units.update(unit.id).url, { preserveScroll: true, onSuccess });
        } else {
            post(units.store().url, { preserveScroll: true, onSuccess });
        }
    };

    return (
        <FormModal
            open={open}
            onOpenChange={handleClose}
            title={isEdit ? 'Editar unidad' : 'Nueva unidad'}
            description={
                isEdit
                    ? 'Actualiza los datos y zonales de esta unidad.'
                    : 'Crea una nueva unidad (sede/local) de la empresa.'
            }
            size="lg"
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
                        {isEdit ? 'Guardar cambios' : 'Crear unidad'}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-5">
                <FormSection
                    index={0}
                    icon={Building2}
                    title="Datos de la unidad"
                    description="Nombre, descripción y foto de la sede/local."
                    columns={2}
                >
                    <FormField
                        id="unit-name"
                        label="Nombre"
                        required
                        error={errors.name}
                    >
                        <Input
                            id="unit-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Unidad Lima Norte"
                            autoComplete="off"
                            autoFocus
                        />
                    </FormField>

                    <FormField
                        id="unit-is-active"
                        label="Estado"
                        hint="Una unidad inactiva no aparece en los catálogos de asignación."
                        error={errors.is_active}
                    >
                        <label
                            htmlFor="unit-is-active"
                            className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <Checkbox
                                id="unit-is-active"
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

                    <FormField
                        id="unit-description"
                        label="Descripción"
                        error={errors.description}
                        className="sm:col-span-2"
                    >
                        <Textarea
                            id="unit-description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder="Detalle de la unidad…"
                            rows={3}
                        />
                    </FormField>

                    <FormField
                        id="unit-photo"
                        label="Foto"
                        error={errors.photo}
                        hint="Imagen JPG o PNG, máximo 4 MB."
                        className="sm:col-span-2"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted/40">
                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Vista previa"
                                        className="size-full object-cover"
                                    />
                                ) : (
                                    <ImagePlus
                                        className="size-6 text-muted-foreground"
                                        strokeWidth={2}
                                    />
                                )}
                            </div>

                            <div className="flex flex-1 items-center gap-2">
                                <Input
                                    id="unit-photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setData(
                                            'photo',
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="cursor-pointer"
                                />
                                {previewUrl && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setData('photo', null)}
                                        className="size-9 shrink-0 cursor-pointer"
                                        title="Quitar foto"
                                        aria-label="Quitar foto"
                                    >
                                        <X
                                            className="size-4"
                                            strokeWidth={2.25}
                                        />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </FormField>
                </FormSection>

                <FormSection
                    index={1}
                    icon={MapPinned}
                    title="Zonales asignadas"
                    description="Selecciona los zonales que operan en esta unidad."
                    columns={1}
                >
                    {zonesCatalog.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Todavía no hay zonales creados.
                        </p>
                    ) : (
                        <div className="grid max-h-48 grid-cols-1 gap-1.5 overflow-y-auto rounded-md border border-input p-2 sm:grid-cols-2">
                            {zonesCatalog.map((zone) => {
                                const checked = data.zone_ids.includes(
                                    zone.id,
                                );

                                return (
                                    <label
                                        key={zone.id}
                                        htmlFor={`unit-zone-${zone.id}`}
                                        className={cn(
                                            'flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-brand-gold-soft/50 dark:hover:bg-brand-gold/10',
                                            !zone.is_active &&
                                                'opacity-60',
                                        )}
                                    >
                                        <Checkbox
                                            id={`unit-zone-${zone.id}`}
                                            checked={checked}
                                            onCheckedChange={() =>
                                                toggleZone(zone.id)
                                            }
                                        />
                                        <span className="truncate text-foreground/90">
                                            {zone.name}
                                        </span>
                                        {!zone.is_active && (
                                            <span className="text-xs text-muted-foreground">
                                                (inactivo)
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </FormSection>
            </div>
        </FormModal>
    );
}
