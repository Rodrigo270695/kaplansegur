import { useForm } from '@inertiajs/react';
import {
    IdCard,
    KeyRound,
    Loader2,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import users from '@/routes/users';
import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_OPTIONS } from '../types';
import type {
    DocumentType,
    Role,
    User,
    UserPostOption,
    UserRoleOption,
} from '../types';

/** Tipos de documento peruanos cuyo número es siempre numérico. */
const NUMERIC_DOCUMENT_TYPES: readonly DocumentType[] = ['dni', 'ruc'];

const isNumericDocumentType = (type: DocumentType | ''): boolean =>
    NUMERIC_DOCUMENT_TYPES.includes(type as DocumentType);

const sanitizeDocumentNumber = (
    value: string,
    type: DocumentType | '',
): string => (isNumericDocumentType(type) ? value.replace(/\D/g, '') : value);

/** Quita acentos/diacríticos y caracteres no alfanuméricos. */
const slugifyUsernamePart = (value: string): string =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

/**
 * Sugiere un nombre de usuario a partir del nombre y apellido, siguiendo
 * la convención habitual: primera letra del nombre + apellido completo
 * (p. ej. "Juan Pérez" → "jperez").
 */
const buildSuggestedUsername = (name: string, lastName: string): string => {
    const first = slugifyUsernamePart(name).charAt(0);
    const last = slugifyUsernamePart(lastName);

    return `${first}${last}`.slice(0, 50);
};

export type UserFormModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Usuario a editar; si es `null`, el modal abre en modo crear. */
    user: User | null;
    /** Catálogo de roles disponibles para el select. */
    rolesCatalog: readonly UserRoleOption[];
    /** Catálogo de puestos activos disponibles para asignar. */
    postsCatalog: readonly UserPostOption[];
};

type UserFormData = {
    username: string;
    name: string;
    last_name: string;
    document_type: DocumentType | '';
    document_number: string;
    phone: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: Role | '';
    is_active: boolean;
    post_id: string;
};

const buildInitialData = (user: User | null): UserFormData => ({
    username: user?.username ?? '',
    name: user?.name ?? '',
    last_name: user?.last_name ?? '',
    document_type: user?.document_type ?? '',
    document_number: user?.document_number ?? '',
    phone: user?.phone ?? '',
    email: user?.email ?? '',
    password: '',
    password_confirmation: '',
    role: user?.role ?? '',
    is_active: user?.is_active ?? true,
    post_id: user?.post_id ? String(user.post_id) : '',
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isFormValid = (data: UserFormData, isEdit: boolean): boolean => {
    if (data.username.trim().length < 3) {
        return false;
    }

    if (data.name.trim().length < 2) {
        return false;
    }

    if (data.last_name.trim().length < 2) {
        return false;
    }

    if (!data.document_type) {
        return false;
    }

    if (data.document_number.trim().length < 3) {
        return false;
    }

    if (data.phone.trim().length < 6) {
        return false;
    }

    if (!EMAIL_REGEX.test(data.email.trim())) {
        return false;
    }

    if (!data.role) {
        return false;
    }

    if (!isEdit) {
        if (data.password.length < 8) {
            return false;
        }

        if (data.password !== data.password_confirmation) {
            return false;
        }
    } else if (data.password.length > 0) {
        if (data.password.length < 8) {
            return false;
        }

        if (data.password !== data.password_confirmation) {
            return false;
        }
    }

    return true;
};

/**
 * Modal de crear/editar usuario.
 *
 * En create, password obligatorio. En edit, dejar el campo vacío
 * conserva la contraseña actual (el backend ignora el campo si llega
 * vacío). El checkbox `is_active` permite suspender sin eliminar.
 *
 * El padre debe montar este componente con un `key` distinto por
 * usuario (por ejemplo `user?.id ?? 'create'`) para que el formulario
 * se reinicialice al cambiar de objetivo, en vez de sincronizar el
 * estado mediante efectos.
 */
export function UserFormModal({
    open,
    onOpenChange,
    user,
    rolesCatalog,
    postsCatalog,
}: UserFormModalProps) {
    const isEdit = user !== null;

    const {
        data,
        setData,
        post,
        put,
        processing,
        errors,
        reset,
        clearErrors,
        isDirty,
    } = useForm<UserFormData>(buildInitialData(user));

    const canSubmit = isFormValid(data, isEdit) && !processing;

    // En edición, el usuario ya tiene un `username` propio: no lo pisamos
    // automáticamente al tocar nombre/apellido salvo que pidan regenerarlo.
    const [usernameTouched, setUsernameTouched] = useState(isEdit);

    const handleNameChange = (value: string) => {
        if (usernameTouched) {
            setData('name', value);
        } else {
            setData({
                ...data,
                name: value,
                username: buildSuggestedUsername(value, data.last_name),
            });
        }
    };

    const handleLastNameChange = (value: string) => {
        if (usernameTouched) {
            setData('last_name', value);
        } else {
            setData({
                ...data,
                last_name: value,
                username: buildSuggestedUsername(data.name, value),
            });
        }
    };

    const handleUsernameChange = (value: string) => {
        setUsernameTouched(true);
        setData('username', value);
    };

    const regenerateUsername = () => {
        setUsernameTouched(false);
        setData('username', buildSuggestedUsername(data.name, data.last_name));
    };

    const handleDocumentTypeChange = (value: DocumentType) => {
        setData({
            ...data,
            document_type: value,
            document_number: sanitizeDocumentNumber(
                data.document_number,
                value,
            ),
        });
    };

    const handleDocumentNumberChange = (value: string) => {
        setData(
            'document_number',
            sanitizeDocumentNumber(value, data.document_type),
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

        if (isEdit && user) {
            put(users.update(user.id).url, { preserveScroll: true, onSuccess });
        } else {
            post(users.store().url, { preserveScroll: true, onSuccess });
        }
    };

    return (
        <FormModal
            open={open}
            onOpenChange={handleClose}
            title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
            description={
                isEdit
                    ? 'Actualiza los datos y permisos de esta cuenta.'
                    : 'Crea una cuenta de acceso al panel administrativo.'
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
                        {isEdit ? 'Guardar cambios' : 'Crear usuario'}
                    </Button>
                </>
            }
        >
            <div className="flex flex-col gap-5">
                <FormSection
                    index={0}
                    icon={UserRound}
                    title="Datos personales"
                    description="Nombre e identificación del colaborador."
                    columns={2}
                >
                    <FormField
                        id="user-name"
                        label="Nombre"
                        required
                        error={errors.name}
                    >
                        <Input
                            id="user-name"
                            value={data.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Juan"
                            autoComplete="off"
                            autoFocus
                        />
                    </FormField>

                    <FormField
                        id="user-last-name"
                        label="Apellido"
                        required
                        error={errors.last_name}
                    >
                        <Input
                            id="user-last-name"
                            value={data.last_name}
                            onChange={(e) =>
                                handleLastNameChange(e.target.value)
                            }
                            placeholder="Pérez"
                            autoComplete="off"
                        />
                    </FormField>

                    <FormField
                        id="user-document-type"
                        label="Tipo de documento"
                        required
                        error={errors.document_type}
                    >
                        <Select
                            value={data.document_type}
                            onValueChange={(value) =>
                                handleDocumentTypeChange(value as DocumentType)
                            }
                        >
                            <SelectTrigger
                                id="user-document-type"
                                className="w-full"
                            >
                                <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                                    <SelectItem
                                        key={option}
                                        value={option}
                                        className="cursor-pointer"
                                    >
                                        {DOCUMENT_TYPE_LABELS[option]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField
                        id="user-document-number"
                        label="Número de documento"
                        required
                        error={errors.document_number}
                        hint={
                            isNumericDocumentType(data.document_type)
                                ? 'Solo números para DNI y RUC.'
                                : undefined
                        }
                    >
                        <Input
                            id="user-document-number"
                            value={data.document_number}
                            onChange={(e) =>
                                handleDocumentNumberChange(e.target.value)
                            }
                            inputMode={
                                isNumericDocumentType(data.document_type)
                                    ? 'numeric'
                                    : 'text'
                            }
                            placeholder="12345678"
                            autoComplete="off"
                        />
                    </FormField>

                    <FormField
                        id="user-phone"
                        label="Teléfono"
                        required
                        error={errors.phone}
                    >
                        <Input
                            id="user-phone"
                            type="tel"
                            value={data.phone}
                            onChange={(e) => setData('phone', e.target.value)}
                            placeholder="987654321"
                            autoComplete="off"
                        />
                    </FormField>
                </FormSection>

                <FormSection
                    index={1}
                    icon={IdCard}
                    title="Cuenta y acceso"
                    description="Credenciales de inicio de sesión y rol asignado."
                    columns={2}
                >
                    <FormField
                        id="user-username"
                        label="Nombre de usuario"
                        required
                        error={errors.username}
                        hint={
                            !errors.username
                                ? usernameTouched
                                    ? 'Puedes editarlo libremente.'
                                    : 'Generado a partir del nombre y apellido. Puedes editarlo.'
                                : undefined
                        }
                    >
                        <div className="flex items-center gap-1.5">
                            <div className="relative flex-1">
                                {!usernameTouched && data.username && (
                                    <Sparkles
                                        className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-brand-gold-accent dark:text-brand-gold"
                                        aria-hidden="true"
                                        strokeWidth={2.25}
                                    />
                                )}
                                <Input
                                    id="user-username"
                                    value={data.username}
                                    onChange={(e) =>
                                        handleUsernameChange(e.target.value)
                                    }
                                    placeholder="jperez"
                                    autoComplete="off"
                                    className={cn(
                                        !usernameTouched &&
                                            data.username &&
                                            'pl-8',
                                    )}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={regenerateUsername}
                                disabled={
                                    !data.name.trim() && !data.last_name.trim()
                                }
                                className="size-9 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                                title="Generar a partir del nombre y apellido"
                                aria-label="Generar nombre de usuario automáticamente"
                            >
                                <RefreshCw
                                    className="size-4"
                                    strokeWidth={2.25}
                                />
                            </Button>
                        </div>
                    </FormField>

                    <FormField
                        id="user-email"
                        label="Correo electrónico"
                        required
                        error={errors.email}
                    >
                        <Input
                            id="user-email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="jperez@kaplansegur.com"
                            autoComplete="off"
                        />
                    </FormField>

                    <FormField
                        id="user-role"
                        label="Rol"
                        required
                        error={errors.role}
                    >
                        <Select
                            value={data.role}
                            onValueChange={(value) =>
                                setData('role', value as Role)
                            }
                        >
                            <SelectTrigger id="user-role" className="w-full">
                                <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent>
                                {rolesCatalog.map((role) => (
                                    <SelectItem
                                        key={role.value}
                                        value={role.value}
                                        className="cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck
                                                className={
                                                    role.value === 'superadmin'
                                                        ? 'size-3.5 text-amber-600 dark:text-amber-400'
                                                        : 'size-3.5 text-brand-gold-accent dark:text-brand-gold'
                                                }
                                                strokeWidth={2.5}
                                            />
                                            {role.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField
                        id="user-post"
                        label="Puesto asignado"
                        error={errors.post_id}
                        hint="Opcional. El puesto de vigilancia donde trabaja este usuario."
                    >
                        <Select
                            value={data.post_id || 'none'}
                            onValueChange={(value) =>
                                setData(
                                    'post_id',
                                    value === 'none' ? '' : value,
                                )
                            }
                        >
                            <SelectTrigger id="user-post" className="w-full">
                                <SelectValue placeholder="Sin puesto asignado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    value="none"
                                    className="cursor-pointer"
                                >
                                    Sin puesto asignado
                                </SelectItem>
                                {postsCatalog.map((option) => (
                                    <SelectItem
                                        key={option.id}
                                        value={String(option.id)}
                                        className="cursor-pointer"
                                    >
                                        {option.name} · {option.unit_name}/
                                        {option.zone_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField
                        id="user-is-active"
                        label="Estado"
                        hint="Un usuario suspendido no puede iniciar sesión."
                        error={errors.is_active}
                    >
                        <label
                            htmlFor="user-is-active"
                            className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 text-sm"
                        >
                            <Checkbox
                                id="user-is-active"
                                checked={data.is_active}
                                onCheckedChange={(checked) =>
                                    setData('is_active', checked === true)
                                }
                            />
                            <span className="text-foreground/80">
                                {data.is_active ? 'Activo' : 'Suspendido'}
                            </span>
                        </label>
                    </FormField>
                </FormSection>

                <FormSection
                    index={2}
                    icon={KeyRound}
                    title="Contraseña"
                    description={
                        isEdit
                            ? 'Deja estos campos vacíos para conservar la contraseña actual.'
                            : 'La contraseña debe tener al menos 8 caracteres.'
                    }
                    columns={2}
                >
                    <FormField
                        id="user-password"
                        label="Contraseña"
                        required={!isEdit}
                        error={errors.password}
                    >
                        <Input
                            id="user-password"
                            type="password"
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            placeholder={
                                isEdit ? '••••••••' : 'Mínimo 8 caracteres'
                            }
                            autoComplete="new-password"
                        />
                    </FormField>

                    <FormField
                        id="user-password-confirmation"
                        label="Confirmar contraseña"
                        required={!isEdit && data.password.length > 0}
                    >
                        <Input
                            id="user-password-confirmation"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            placeholder={
                                isEdit ? '••••••••' : 'Repite la contraseña'
                            }
                            autoComplete="new-password"
                        />
                    </FormField>
                </FormSection>
            </div>
        </FormModal>
    );
}
