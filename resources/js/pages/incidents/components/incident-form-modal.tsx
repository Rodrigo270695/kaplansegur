import { useForm } from '@inertiajs/react';
import {
    Clock,
    Loader2,
    MapPin,
    Paperclip,
    ShieldAlert,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { FormField, FormModal, FormSection } from '@/components/forms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/format';
import { getCachedCoordinates } from '@/lib/geolocation';
import incidents from '@/routes/incidents';
import type { Incident, ReasonCatalogEntry } from '../types';

export type IncidentFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Incidencia a editar; si es `null`, el modal abre en modo crear. */
    incident: Incident | null;
    /** Catálogo de motivos activos disponibles para el formulario. */
    reasonsCatalog: readonly ReasonCatalogEntry[];
};

type IncidentFormData = {
    reason_id: string;
    detail: string;
    evidence: File | null;
    latitude: string;
    longitude: string;
};

const buildInitialData = (incident: Incident | null): IncidentFormData => ({
    reason_id: incident ? String(incident.reason_id) : '',
    detail: incident?.detail ?? '',
    evidence: null,
    latitude: incident?.latitude ?? '',
    longitude: incident?.longitude ?? '',
});

const isFormValid = (data: IncidentFormData): boolean =>
    data.reason_id !== '' && data.detail.trim().length >= 5;

type GeoStatus = 'idle' | 'locating' | 'ready' | 'denied' | 'unsupported';

const evidenceFileName = (url: string): string => {
    try {
        return decodeURIComponent(url.split('/').pop() ?? url);
    } catch {
        return url;
    }
};

/**
 * Modal de crear/editar Incidencia.
 *
 * La fecha/hora (`occurred_at`) y el reportante los fija el backend
 * automáticamente al crear el registro. El GPS se captura en el
 * navegador solo en modo creación (una vez, vía Geolocation API); en
 * edición se conserva el capturado originalmente y no se vuelve a
 * solicitar.
 *
 * El padre debe montar este componente con un `key` distinto por
 * incidencia (por ejemplo `incident?.id ?? 'create'`) para que el
 * formulario se reinicialice al cambiar de objetivo.
 */
export function IncidentFormModal({
    open,
    onOpenChange,
    incident,
    reasonsCatalog,
}: IncidentFormModalProps) {
    const isEdit = incident !== null;

    const { data, setData, post, put, processing, errors, reset, clearErrors, isDirty } =
        useForm<IncidentFormData>(buildInitialData(incident));

    const [geoStatus, setGeoStatus] = useState<GeoStatus>(
        isEdit ? 'ready' : 'idle',
    );

    useEffect(() => {
        if (!open || isEdit) {
            return;
        }

        let cancelled = false;

        // El permiso ya se pidió al iniciar sesión (ver
        // `app-sidebar-layout.tsx`); si esa captura sigue fresca, se usa
        // de inmediato en vez de esperar una nueva.
        const cached = getCachedCoordinates();

        if (cached) {
            queueMicrotask(() => {
                if (!cancelled) {
                    setData((current) => ({
                        ...current,
                        latitude: String(cached.latitude),
                        longitude: String(cached.longitude),
                    }));
                    setGeoStatus('ready');
                }
            });

            return () => {
                cancelled = true;
            };
        }

        if (!('geolocation' in navigator)) {
            queueMicrotask(() => {
                if (!cancelled) {
                    setGeoStatus('unsupported');
                }
            });

            return () => {
                cancelled = true;
            };
        }

        queueMicrotask(() => {
            if (!cancelled) {
                setGeoStatus('locating');
            }
        });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (cancelled) {
                    return;
                }

                setData((current) => ({
                    ...current,
                    latitude: String(position.coords.latitude),
                    longitude: String(position.coords.longitude),
                }));
                setGeoStatus('ready');
            },
            () => {
                if (!cancelled) {
                    setGeoStatus('denied');
                }
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
        );

        return () => {
            cancelled = true;
        };
    }, [open, isEdit, setData]);

    const incidentEvidenceUrl = incident?.evidence_url ?? null;

    const evidencePreviewName = useMemo(() => {
        if (data.evidence) {
            return data.evidence.name;
        }

        if (incidentEvidenceUrl) {
            return evidenceFileName(incidentEvidenceUrl);
        }

        return null;
    }, [data.evidence, incidentEvidenceUrl]);

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

        if (isEdit && incident) {
            put(incidents.update(incident.id).url, { preserveScroll: true, onSuccess });
        } else {
            post(incidents.store().url, { preserveScroll: true, onSuccess });
        }
    };

    const geoLabel: Record<GeoStatus, string> = {
        idle: 'Esperando ubicación…',
        locating: 'Obteniendo tu ubicación…',
        ready:
            data.latitude && data.longitude
                ? `Ubicación capturada: ${Number(data.latitude).toFixed(5)}, ${Number(data.longitude).toFixed(5)}`
                : 'Sin ubicación registrada.',
        denied: 'No se pudo obtener tu ubicación (puedes continuar sin ella).',
        unsupported: 'Este navegador no soporta geolocalización.',
    };

    return (
        <FormModal
            open={open}
            onOpenChange={handleClose}
            title={isEdit ? 'Editar incidencia' : 'Nueva incidencia'}
            description={
                isEdit
                    ? 'Actualiza el motivo, el detalle o la evidencia de esta incidencia.'
                    : 'Registra una nueva incidencia. La fecha, hora y ubicación se registran automáticamente.'
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
                        disabled={!isFormValid(data) || processing}
                        className="cursor-pointer gap-2 disabled:cursor-not-allowed"
                    >
                        {processing && (
                            <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                            />
                        )}
                        {isEdit ? 'Guardar cambios' : 'Registrar incidencia'}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-5">
                <FormSection
                    index={0}
                    icon={ShieldAlert}
                    title="Datos de la incidencia"
                    description="Motivo y detalle de lo ocurrido."
                    columns={1}
                >
                    <FormField
                        id="incident-reason"
                        label="Motivo"
                        required
                        error={errors.reason_id}
                        hint={
                            reasonsCatalog.length === 0
                                ? 'Crea primero un motivo activo.'
                                : undefined
                        }
                    >
                        <Select
                            value={data.reason_id}
                            onValueChange={(value) =>
                                setData('reason_id', value)
                            }
                        >
                            <SelectTrigger
                                id="incident-reason"
                                className="w-full"
                            >
                                <SelectValue placeholder="Selecciona un motivo" />
                            </SelectTrigger>
                            <SelectContent>
                                {reasonsCatalog.map((reason) => (
                                    <SelectItem
                                        key={reason.id}
                                        value={String(reason.id)}
                                        className="cursor-pointer"
                                    >
                                        {reason.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField
                        id="incident-detail"
                        label="Detalle"
                        required
                        error={errors.detail}
                    >
                        <Textarea
                            id="incident-detail"
                            value={data.detail}
                            onChange={(e) =>
                                setData('detail', e.target.value)
                            }
                            placeholder="Describe lo ocurrido: qué pasó, quiénes estuvieron involucrados, acciones tomadas…"
                            rows={4}
                            autoFocus
                        />
                    </FormField>

                    <FormField
                        id="incident-evidence"
                        label="Evidencia"
                        error={errors.evidence}
                        hint="Imagen, PDF o video. Máximo 20 MB."
                    >
                        <div className="flex items-center gap-2">
                            <Input
                                id="incident-evidence"
                                type="file"
                                accept="image/*,application/pdf,video/*"
                                onChange={(e) =>
                                    setData(
                                        'evidence',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                                className="cursor-pointer"
                            />
                            {data.evidence && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() =>
                                        setData('evidence', null)
                                    }
                                    className="size-9 shrink-0 cursor-pointer"
                                    title="Quitar archivo"
                                    aria-label="Quitar archivo"
                                >
                                    <X
                                        className="size-4"
                                        strokeWidth={2.25}
                                    />
                                </Button>
                            )}
                        </div>
                        {evidencePreviewName && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Paperclip
                                    className="size-3.5"
                                    strokeWidth={2.25}
                                />
                                <span className="truncate">
                                    {evidencePreviewName}
                                </span>
                            </p>
                        )}
                    </FormField>
                </FormSection>

                <FormSection
                    index={1}
                    icon={Clock}
                    title={
                        isEdit
                            ? 'Registro del sistema'
                            : 'Fecha, hora y ubicación'
                    }
                    description={
                        isEdit
                            ? 'Estos datos se registraron automáticamente y no se pueden editar.'
                            : 'Se registran automáticamente al guardar (zona horaria Perú).'
                    }
                    columns={1}
                >
                    <div className="flex flex-col gap-2 rounded-md border border-dashed border-input bg-muted/40 p-3 text-sm">
                        <div className="flex items-center gap-2 text-foreground/80">
                            <Clock
                                className="size-4 shrink-0 text-muted-foreground"
                                strokeWidth={2.25}
                            />
                            {isEdit && incident
                                ? formatDateTime(incident.occurred_at)
                                : 'Se registrará con la fecha y hora actual del sistema.'}
                        </div>
                        <div className="flex items-center gap-2 text-foreground/80">
                            <MapPin
                                className="size-4 shrink-0 text-muted-foreground"
                                strokeWidth={2.25}
                            />
                            {isEdit ? geoLabel.ready : geoLabel[geoStatus]}
                        </div>
                    </div>
                </FormSection>
            </div>
        </FormModal>
    );
}
