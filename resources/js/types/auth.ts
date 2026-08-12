export type Role = 'superadmin' | 'agent';

export type DocumentType = 'dni' | 'ce' | 'passport' | 'ruc';

/** Puesto de vigilancia asignado a un usuario (relación `User::post()`). */
export type UserPost = {
    id: number;
    name: string;
    unit_zone?: {
        unit?: { id: number; name: string } | null;
        zone?: { id: number; name: string } | null;
    } | null;
};

export type User = {
    id: number;
    username: string;
    name: string;
    last_name: string;
    document_type: DocumentType;
    document_number: string;
    phone: string;
    role: Role;
    is_active: boolean;
    post_id: number | null;
    post?: UserPost | null;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
};

export type Auth = {
    user: User;
};

/* @chisel-passkeys */
export type Passkey = {
    id: number;
    name: string;
    authenticator: string | null;
    created_at_diff: string;
    last_used_at_diff: string | null;
};
/* @end-chisel-passkeys */

export type TwoFactorSetupData = {
    svg: string;
    url: string;
};

export type TwoFactorSecretKey = {
    secretKey: string;
};
