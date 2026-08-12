import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;

    return (
        <>
            <Head title="Configuración de perfil" />

            <h1 className="sr-only">Configuración de perfil</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Perfil"
                    description="Actualiza tu información personal"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="username">
                                    Nombre de usuario
                                </Label>

                                <Input
                                    id="username"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.username}
                                    name="username"
                                    required
                                    autoComplete="username"
                                    placeholder="Nombre de usuario"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.username}
                                />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nombre</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="given-name"
                                        placeholder="Nombre"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="last_name">
                                        Apellido
                                    </Label>

                                    <Input
                                        id="last_name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.last_name}
                                        name="last_name"
                                        required
                                        autoComplete="family-name"
                                        placeholder="Apellido"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.last_name}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="document_type">
                                        Tipo de documento
                                    </Label>

                                    <select
                                        id="document_type"
                                        name="document_type"
                                        required
                                        defaultValue={auth.user.document_type}
                                        className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        <option value="dni">DNI</option>
                                        <option value="ce">CE</option>
                                        <option value="passport">
                                            Pasaporte
                                        </option>
                                        <option value="ruc">RUC</option>
                                    </select>

                                    <InputError
                                        className="mt-2"
                                        message={errors.document_type}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="document_number">
                                        Número de documento
                                    </Label>

                                    <Input
                                        id="document_number"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.document_number}
                                        name="document_number"
                                        required
                                        placeholder="Número de documento"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.document_number}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="phone">Teléfono</Label>

                                <Input
                                    id="phone"
                                    type="tel"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.phone}
                                    name="phone"
                                    required
                                    autoComplete="tel"
                                    placeholder="Teléfono"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.phone}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    Correo electrónico
                                </Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Correo electrónico"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Tu correo electrónico no está
                                            verificado.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Haz clic aquí para reenviar el
                                                correo de verificación.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                Se ha enviado un nuevo enlace
                                                de verificación a tu correo
                                                electrónico.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Guardar
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Configuración de perfil',
            href: edit(),
        },
    ],
};
