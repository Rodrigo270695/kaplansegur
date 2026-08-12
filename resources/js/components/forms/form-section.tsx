import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type FormSectionProps = {
    title: string;
    description?: string;
    children: ReactNode;
    icon?: LucideIcon;
    /** Si true, los children se acomodan en grid 2-col en desktop. */
    columns?: 1 | 2;
    /** Índice para crear un efecto stagger cuando hay varias secciones. */
    index?: number;
    className?: string;
};

/**
 * Sección de formulario con encabezado + grid configurable. Lleva una
 * animación de entrada (fade + slide) para acompañar al modal padre.
 */
export function FormSection({
    title,
    description,
    children,
    icon: Icon,
    columns = 1,
    index = 0,
    className,
}: FormSectionProps) {
    return (
        <section
            style={{ animationDelay: `${index * 80}ms` }}
            className={cn(
                'flex animate-in flex-col gap-3 duration-500 fill-mode-both fade-in slide-in-from-bottom-2',
                className,
            )}
        >
            <header className="flex items-start gap-2.5">
                {Icon && (
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-gold-soft text-brand-gold-accent ring-1 ring-brand-gold/20 dark:bg-brand-gold/10 dark:text-brand-gold">
                        <Icon className="size-3.5" strokeWidth={2.25} />
                    </span>
                )}
                <div className="flex flex-col gap-0.5">
                    <h3 className="text-sm leading-tight font-semibold text-foreground">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-xs text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </header>

            <div
                className={cn(
                    'grid gap-4',
                    columns === 2 && 'sm:grid-cols-2 sm:gap-x-5',
                )}
            >
                {children}
            </div>
        </section>
    );
}
