/**
 * El sistema solo soporta modo claro: no hay selector de apariencia
 * ni modo oscuro. Este stub se mantiene únicamente para no tener que
 * tocar los consumidores existentes (`sonner.tsx`,
 * `two-factor-setup-modal.tsx`) que leen `resolvedAppearance`.
 */
export type ResolvedAppearance = 'light';
export type Appearance = ResolvedAppearance;

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
};

export function initializeTheme(): void {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';
}

export function useAppearance(): UseAppearanceReturn {
    return { appearance: 'light', resolvedAppearance: 'light' } as const;
}
