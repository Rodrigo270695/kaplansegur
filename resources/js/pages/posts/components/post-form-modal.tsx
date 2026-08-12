import { useForm } from '@inertiajs/react';
import { Loader2, MapPin, ShieldCheck } from 'lucide-react';
import { useMemo } from 'react';
import type { FormEvent } from 'react';
import { FormField, FormModal, FormSection } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import posts from '@/routes/posts';
import type { Post, UnitCatalogEntry } from '../types';

export type PostFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Puesto a editar; si es `null`, el modal abre en modo crear. */
    post: Post | null;
    /** Catálogo Unidad → Zonales asignadas, para el select en cascada. */
    unitsCatalog: readonly UnitCatalogEntry[];
};

type PostFormData = {
    unit_id: string;
    zone_id: string;
    name: string;
    address: string;
    description: string;
    is_active: boolean;
};

const buildInitialData = (post: Post | null): PostFormData => ({
    unit_id: post ? String(post.unit_zone.unit.id) : '',
    zone_id: post ? String(post.unit_zone.zone.id) : '',
    name: post?.name ?? '',
    address: post?.address ?? '',
    description: post?.description ?? '',
    is_active: post?.is_active ?? true,
});

const isFormValid = (data: PostFormData): boolean =>
    data.unit_id !== '' &&
    data.zone_id !== '' &&
    data.name.trim().length >= 2;

/**
 * Modal de crear/editar Puesto.
 *
 * El formulario pide Unidad + Zonal (más natural que elegir un
 * `unit_zone_id`); el backend valida que esa combinación exista
 * realmente en la tabla intermedia `unit_zones` y resuelve el id
 * final. Al cambiar la Unidad se limpia la Zonal si ya no aplica.
 *
 * El padre debe montar este componente con un `key` distinto por
 * puesto (por ejemplo `post?.id ?? 'create'`) para que el formulario
 * se reinicialice al cambiar de objetivo.
 */
export function PostFormModal({
    open,
    onOpenChange,
    post,
    unitsCatalog,
}: PostFormModalProps) {
    const isEdit = post !== null;

    const { data, setData, post: submitPost, put, processing, errors, reset, clearErrors, isDirty } =
        useForm<PostFormData>(buildInitialData(post));

    const canSubmit = isFormValid(data) && !processing;

    const selectedUnit = useMemo(
        () => unitsCatalog.find((unit) => String(unit.id) === data.unit_id),
        [unitsCatalog, data.unit_id],
    );

    const zoneOptions = selectedUnit?.zones ?? [];

    const handleUnitChange = (value: string) => {
        const unit = unitsCatalog.find((u) => String(u.id) === value);
        const stillValid = unit?.zones.some(
            (zone) => String(zone.id) === data.zone_id,
        );

        setData({
            ...data,
            unit_id: value,
            zone_id: stillValid ? data.zone_id : '',
        });
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

        if (isEdit && post) {
            put(posts.update(post.id).url, { preserveScroll: true, onSuccess });
        } else {
            submitPost(posts.store().url, { preserveScroll: true, onSuccess });
        }
    };

    return (
        <FormModal
            open={open}
            onOpenChange={handleClose}
            title={isEdit ? 'Editar puesto' : 'Nuevo puesto'}
            description={
                isEdit
                    ? 'Actualiza los datos de este puesto de vigilancia.'
                    : 'Crea un nuevo puesto dentro de una unidad y zonal.'
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
                        {isEdit ? 'Guardar cambios' : 'Crear puesto'}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-5">
                <FormSection
                    index={0}
                    icon={MapPin}
                    title="Ubicación"
                    description="Unidad y zonal a la que pertenece este puesto."
                    columns={2}
                >
                    <FormField
                        id="post-unit"
                        label="Unidad"
                        required
                        error={errors.unit_id}
                        hint={
                            unitsCatalog.length === 0
                                ? 'Crea primero una unidad activa.'
                                : undefined
                        }
                    >
                        <Select
                            value={data.unit_id}
                            onValueChange={handleUnitChange}
                        >
                            <SelectTrigger id="post-unit" className="w-full">
                                <SelectValue placeholder="Selecciona una unidad" />
                            </SelectTrigger>
                            <SelectContent>
                                {unitsCatalog.map((unit) => (
                                    <SelectItem
                                        key={unit.id}
                                        value={String(unit.id)}
                                        className="cursor-pointer"
                                    >
                                        {unit.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField
                        id="post-zone"
                        label="Zonal"
                        required
                        error={errors.zone_id}
                        hint={
                            data.unit_id && zoneOptions.length === 0
                                ? 'Esta unidad no tiene zonales asignadas.'
                                : undefined
                        }
                    >
                        <Select
                            value={data.zone_id}
                            onValueChange={(value) =>
                                setData('zone_id', value)
                            }
                            disabled={!data.unit_id || zoneOptions.length === 0}
                        >
                            <SelectTrigger id="post-zone" className="w-full">
                                <SelectValue placeholder="Selecciona una zonal" />
                            </SelectTrigger>
                            <SelectContent>
                                {zoneOptions.map((zone) => (
                                    <SelectItem
                                        key={zone.id}
                                        value={String(zone.id)}
                                        className="cursor-pointer"
                                    >
                                        {zone.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                </FormSection>

                <FormSection
                    index={1}
                    icon={ShieldCheck}
                    title="Datos del puesto"
                    description="Nombre, dirección y descripción del puesto."
                    columns={2}
                >
                    <FormField
                        id="post-name"
                        label="Nombre"
                        required
                        error={errors.name}
                    >
                        <Input
                            id="post-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Puesto Principal"
                            autoComplete="off"
                        />
                    </FormField>

                    <FormField
                        id="post-address"
                        label="Dirección"
                        error={errors.address}
                    >
                        <Input
                            id="post-address"
                            value={data.address}
                            onChange={(e) =>
                                setData('address', e.target.value)
                            }
                            placeholder="Av. Principal 123"
                            autoComplete="off"
                        />
                    </FormField>

                    <FormField
                        id="post-description"
                        label="Descripción"
                        error={errors.description}
                        className="sm:col-span-2"
                    >
                        <Textarea
                            id="post-description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder="Detalle del puesto…"
                            rows={3}
                        />
                    </FormField>

                    <FormField
                        id="post-is-active"
                        label="Estado"
                        hint="Un puesto inactivo no aparece en la asignación de usuarios."
                        error={errors.is_active}
                    >
                        <label
                            htmlFor="post-is-active"
                            className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <Checkbox
                                id="post-is-active"
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
