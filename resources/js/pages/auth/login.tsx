import { Form, Head, Link } from '@inertiajs/react';
import { LockKeyhole, LogIn, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home } from '@/routes';
import { store } from '@/routes/login';

type Props = {
    status?: string;
};

const stats = [
    { value: '+20', label: 'Clientes satisfechos' },
    { value: '+210', label: 'Colaboradores' },
    { value: '+10', label: 'Años de experiencia' },
];

type TileContent =
    | { size: number; kind: 'color'; tone: 'gold' | 'black' }
    | { size: number; kind: 'photo'; src: string; position?: string };

/**
 * Filas de rombos de tamaños bien distintos (grandes y chicos
 * mezclados, nada de una cuadrícula pareja tipo ajedrez). Cada fila es
 * una fila `flex` normal con sus rombos centrados verticalmente entre
 * sí; varias filas apiladas -con su propio alto según el rombo más
 * grande que contengan- y luego TODO el bloque se rota -45° de una
 * sola vez. Como las filas nunca se tocan entre sí (ni los rombos
 * dentro de cada fila, por el `gap`), la rotación conjunta no genera
 * ningún solape, y el resultado son varias diagonales -no una sola
 * cadena- con rombos grandes y pequeños alternados.
 */
const mosaicRows: TileContent[][] = [
    [
        { size: 58, kind: 'color', tone: 'gold' },
        { size: 122, kind: 'photo', src: '/images/login-mosaic-agent-radio.png' },
        { size: 50, kind: 'color', tone: 'black' },
    ],
    [
        { size: 76, kind: 'color', tone: 'black' },
        { size: 150, kind: 'photo', src: '/images/login-mosaic-monitors.png' },
        { size: 56, kind: 'color', tone: 'gold' },
        { size: 100, kind: 'photo', src: '/images/login-mosaic-agent-1.png' },
    ],
    [
        { size: 132, kind: 'photo', src: '/images/login-mosaic-agent-2.png' },
        { size: 48, kind: 'color', tone: 'gold' },
        { size: 80, kind: 'color', tone: 'black' },
        { size: 44, kind: 'color', tone: 'gold' },
    ],
    [
        { size: 62, kind: 'color', tone: 'gold' },
        { size: 116, kind: 'photo', src: '/images/login-mosaic-agent-radio.png' },
        { size: 52, kind: 'color', tone: 'black' },
        { size: 88, kind: 'color', tone: 'gold' },
    ],
    [
        { size: 70, kind: 'color', tone: 'black' },
        { size: 46, kind: 'color', tone: 'gold' },
        { size: 92, kind: 'photo', src: '/images/login-mosaic-monitors.png' },
    ],
];

/**
 * Un rombo individual: el marco (cuadrado con `overflow-hidden`) se ve
 * como rombo por la rotación del bloque abuelo; el contenido de la
 * foto se contrarrota en sentido opuesto y se agranda para verse
 * derecho y cubrir el marco sin huecos en las esquinas.
 */
function DiamondTile({ tile }: { tile: TileContent }) {
    // Para que la foto cubra el marco por completo tras la
    // contra-rotación (sin huecos en las esquinas), su tamaño debe ser
    // el del marco * √2. El margen extra se reparte a cada lado.
    const overshoot = tile.size * ((Math.SQRT2 - 1) / 2);

    return (
        <div
            className="relative shrink-0 overflow-hidden shadow-[0_14px_28px_rgba(20,18,16,0.25)] ring-1 ring-black/5"
            style={{
                width: tile.size,
                height: tile.size,
                backgroundColor: tile.kind === 'color' ? (tile.tone === 'gold' ? 'var(--brand-gold)' : 'var(--brand-black)') : undefined,
            }}
        >
            {tile.kind === 'photo' && (
                <div
                    className="absolute rotate-45"
                    style={{
                        inset: -overshoot,
                        backgroundImage: `url(${tile.src})`,
                        backgroundSize: 'cover',
                        backgroundPosition: tile.position ?? 'center',
                    }}
                />
            )}
        </div>
    );
}

/**
 * Mosaico de rombos en varias filas diagonales, con tamaños grandes y
 * chicos mezclados (nada de cuadrícula pareja tipo ajedrez): varias
 * filas `flex` apiladas en columna, cada una con rombos de tamaños
 * distintos, y todo el bloque rotado -45° de una sola vez para que
 * cada fila se convierta en una diagonal.
 */
function DiamondMosaic() {
    return (
        <div
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
            <div className="flex w-max translate-x-4 -rotate-45 flex-col gap-4">
                {mosaicRows.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center gap-3">
                        {row.map((tile, tileIndex) => (
                            <DiamondTile key={tileIndex} tile={tile} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * Login: un solo fondo claro para toda la página (sin panel ni barra
 * que divida la pantalla en dos bloques de color). A la izquierda,
 * un mosaico amplio de rombos grandes (fotos de agentes + color
 * sólido dorado/negro) que se extiende hacia la izquierda del panel,
 * junto al logo y la frase de marca; a la derecha, el formulario en
 * una tarjeta limpia y opaca. En móvil el mosaico y el bloque
 * izquierdo se ocultan y solo queda una cabecera compacta con el
 * logo.
 */
export default function Login({ status }: Props) {
    return (
        <>
            <Head title="Iniciar sesión" />

            <div className="relative flex min-h-svh overflow-hidden bg-background">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 z-20 h-1 bg-linear-to-r from-brand-black via-brand-gold to-brand-black"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-linear-to-br from-brand-gold-soft/50 via-background to-background"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(20,18,16,0.06)_1px,transparent_1px)] bg-size-[26px_26px] opacity-40"
                />

                <div className="relative hidden w-full max-w-3xl shrink-0 md:flex lg:max-w-4xl">
                    <div className="relative z-10 flex w-64 shrink-0 flex-col justify-between p-10 lg:w-72 lg:p-14">
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo.png"
                                alt="Kaplansegur"
                                className="h-20 w-20 object-contain drop-shadow-[0_10px_18px_rgba(20,18,16,0.2)]"
                            />
                            <div className="flex flex-col">
                                <span className="text-lg font-bold tracking-tight text-foreground">
                                    KAPLANSEGUR
                                </span>
                                <span className="text-[10px] font-semibold tracking-[0.3em] text-brand-gold-accent uppercase">
                                    ¡Seguridad total!
                                </span>
                            </div>
                        </div>

                        <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold/40 bg-brand-gold-soft px-3 py-1 text-xs font-semibold text-brand-gold-accent">
                                <ShieldCheck className="size-3.5" />
                                Panel de gestión de incidencias
                            </span>
                            <h2 className="mt-4 text-3xl font-bold leading-tight text-foreground">
                                &ldquo;Un solo puño,
                                <br />
                                un solo corazón&rdquo;
                            </h2>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                                Comprometidos con la seguridad de las
                                personas, activos e información de
                                nuestros clientes en todo el país.
                            </p>

                            <div className="mt-8 grid grid-cols-3 gap-3 border-t border-border pt-6">
                                {stats.map((stat) => (
                                    <div key={stat.label}>
                                        <p className="text-xl font-bold text-brand-gold-accent">
                                            {stat.value}
                                        </p>
                                        <p className="text-[11px] leading-tight text-muted-foreground">
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="relative min-w-0 flex-1">
                        <DiamondMosaic />
                    </div>
                </div>

                <div className="relative flex w-full flex-1 flex-col items-center justify-center px-4 py-14 sm:px-6">
                    <div
                        aria-hidden
                        className="pointer-events-none absolute -top-40 right-0 size-96 rounded-full bg-brand-gold/15 blur-3xl"
                    />

                    <div className="relative z-10 flex w-full max-w-md flex-col items-center">
                        <Link
                            href={home()}
                            className="relative mb-5 transition-transform hover:scale-105 md:hidden"
                        >
                            <div
                                aria-hidden
                                className="absolute inset-0 -z-10 scale-90 rounded-full bg-brand-gold/35 blur-2xl"
                            />
                            <img
                                src="/logo.png"
                                alt="Kaplansegur"
                                className="h-32 w-32 object-contain drop-shadow-[0_20px_32px_rgba(20,18,16,0.25)]"
                            />
                        </Link>

                        <div className="mb-8 flex flex-col items-center gap-2.5 text-center md:hidden">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-gold/40 bg-brand-gold-soft px-3 py-1 text-xs font-semibold text-brand-gold-accent">
                                <ShieldCheck className="size-3.5" />
                                Panel de gestión de incidencias
                            </span>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                KAPLANSEGUR
                            </h1>
                            <p className="text-[11px] font-semibold tracking-[0.25em] text-muted-foreground uppercase">
                                &ldquo;Un solo puño, un solo corazón&rdquo;
                            </p>
                        </div>

                        <div className="relative w-full overflow-hidden rounded-2xl border border-black/8 bg-white shadow-[0_30px_60px_-20px_rgba(20,18,16,0.35)] ring-1 ring-black/3">
                            <div
                                aria-hidden
                                className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-brand-black via-brand-gold to-brand-black"
                            />
                            <div
                                aria-hidden
                                className="absolute -top-16 -right-16 size-48 rounded-full bg-brand-gold/20 blur-3xl"
                            />
                            <div
                                aria-hidden
                                className="absolute -bottom-20 -left-16 size-44 rounded-full bg-brand-gold-accent/10 blur-3xl"
                            />

                            <div className="relative p-7 sm:p-8">
                                <div className="mb-6 flex flex-col items-center gap-2 text-center">
                                    <span className="flex size-11 items-center justify-center rounded-full bg-linear-to-br from-brand-gold to-brand-gold-accent shadow-lg shadow-brand-gold/40">
                                        <Sparkles className="size-5 text-brand-gold-foreground" />
                                    </span>
                                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                                        Bienvenido de nuevo
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Ingresa tus credenciales para
                                        acceder al panel.
                                    </p>
                                </div>

                                <Form
                                    {...store.form()}
                                    resetOnSuccess={['password']}
                                    className="flex flex-col gap-5"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="username"
                                                    className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                                                >
                                                    Usuario
                                                </Label>
                                                <div className="group relative">
                                                    <span className="pointer-events-none absolute top-1/2 left-3 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg bg-brand-gold-soft transition-colors group-focus-within:bg-brand-gold/25">
                                                        <UserRound className="size-3.5 text-brand-gold-accent" />
                                                    </span>
                                                    <Input
                                                        id="username"
                                                        type="text"
                                                        name="username"
                                                        required
                                                        autoFocus
                                                        tabIndex={1}
                                                        autoComplete="username"
                                                        placeholder="Tu usuario"
                                                        className="h-12 rounded-xl border-border bg-muted/40 pl-12 shadow-sm focus-visible:border-brand-gold-accent/60 focus-visible:bg-white focus-visible:ring-brand-gold-accent/25"
                                                    />
                                                </div>
                                                <InputError
                                                    message={errors.username}
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <Label
                                                    htmlFor="password"
                                                    className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                                                >
                                                    Contraseña
                                                </Label>
                                                <div className="group relative">
                                                    <span className="pointer-events-none absolute top-1/2 left-3 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg bg-brand-gold-soft transition-colors group-focus-within:bg-brand-gold/25">
                                                        <LockKeyhole className="size-3.5 text-brand-gold-accent" />
                                                    </span>
                                                    <PasswordInput
                                                        id="password"
                                                        name="password"
                                                        required
                                                        tabIndex={2}
                                                        autoComplete="current-password"
                                                        placeholder="Tu contraseña"
                                                        className="h-12 rounded-xl border-border bg-muted/40 pl-12 shadow-sm focus-visible:border-brand-gold-accent/60 focus-visible:bg-white focus-visible:ring-brand-gold-accent/25"
                                                    />
                                                </div>
                                                <InputError
                                                    message={errors.password}
                                                />
                                            </div>

                                            <div className="flex items-center space-x-3">
                                                <Checkbox
                                                    id="remember"
                                                    name="remember"
                                                    tabIndex={3}
                                                />
                                                <Label
                                                    htmlFor="remember"
                                                    className="text-sm font-normal text-muted-foreground"
                                                >
                                                    Recordar mi sesión
                                                </Label>
                                            </div>

                                            <Button
                                                type="submit"
                                                size="lg"
                                                className="mt-2 w-full rounded-xl font-semibold shadow-lg shadow-brand-gold/25"
                                                tabIndex={4}
                                                disabled={processing}
                                                data-test="login-button"
                                            >
                                                {processing ? (
                                                    <Spinner />
                                                ) : (
                                                    <LogIn className="size-4" />
                                                )}
                                                Iniciar sesión
                                            </Button>
                                        </>
                                    )}
                                </Form>

                                {status && (
                                    <div className="mt-4 text-center text-sm font-medium text-green-600">
                                        {status}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-7 grid w-full grid-cols-3 divide-x divide-border/70 rounded-xl border border-border/70 bg-muted/30 py-3.5 md:hidden">
                            {stats.map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <p className="text-base font-bold text-brand-gold-accent">
                                        {stat.value}
                                    </p>
                                    <p className="px-1 text-[11px] leading-tight text-muted-foreground">
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                            <ShieldCheck className="size-3.5" />
                            Acceso exclusivo para personal autorizado
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
