import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <img
                src="/logo.png"
                alt={name}
                className="size-8 shrink-0 object-contain"
            />
            <div className="ml-2 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="mb-0.5 truncate text-sm leading-tight font-bold tracking-tight">
                    {name}
                </span>
                <span className="truncate text-[10px] leading-tight tracking-wide text-brand-gold-accent uppercase">
                    Seguridad total
                </span>
            </div>
        </>
    );
}
