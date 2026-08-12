import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import {
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { User } from '@/types';

type Props = {
    user: User;
    /** Se ejecuta al navegar a un ítem (por ejemplo, para cerrar el sidebar móvil). */
    onNavigate?: () => void;
};

export function UserMenuContent({ user, onNavigate }: Props) {
    const cleanup = useMobileNavigation();

    const handleNavigate = () => {
        cleanup();
        onNavigate?.();
    };

    const handleLogout = () => {
        cleanup();
        onNavigate?.();
        router.flushAll();
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link
                        className="block w-full cursor-pointer"
                        href={edit()}
                        prefetch
                        onClick={handleNavigate}
                    >
                        <Settings className="mr-2" />
                        Configuración
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
                <Link
                    className="block w-full cursor-pointer"
                    href={logout()}
                    as="button"
                    onClick={handleLogout}
                    data-test="logout-button"
                >
                    <LogOut className="mr-2" />
                    Cerrar sesión
                </Link>
            </DropdownMenuItem>
        </>
    );
}
