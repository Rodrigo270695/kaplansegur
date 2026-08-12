import type { UserPost } from '@/types/auth';

/**
 * Tipos del Dashboard. Hay dos vistas completamente distintas según
 * el rol (ver `DashboardController`): superadmin ve el panorama
 * global de la operación; agente ve solo su puesto y sus propios
 * reportes.
 */

export type DashboardIncidentReason = {
    id: number;
    name: string;
};

export type DashboardIncidentReporter = {
    id: number;
    name: string;
    last_name: string;
    post?: UserPost | null;
};

export type DashboardIncident = {
    id: number;
    occurred_at: string;
    detail: string;
    evidence_url: string | null;
    reason?: DashboardIncidentReason;
    user?: DashboardIncidentReporter | null;
};

export type DashboardUnit = {
    id: number;
    name: string;
    photo_url: string | null;
};

export type SuperAdminDashboardStats = {
    users: number;
    units: number;
    zones: number;
    posts: number;
    incidents_total: number;
    incidents_today: number;
    incidents_with_evidence: number;
};

export type AgentDashboardStats = {
    post_incidents_today: number;
    post_incidents_total: number;
    my_incidents_today: number;
    my_incidents_total: number;
};

export type SuperAdminDashboardProps = {
    role: 'superadmin';
    units: DashboardUnit[];
    stats: SuperAdminDashboardStats;
    recent_incidents: DashboardIncident[];
};

export type AgentDashboardProps = {
    role: 'agent';
    post_name: string | null;
    stats: AgentDashboardStats;
    recent_incidents: DashboardIncident[];
};

export type DashboardPageProps = SuperAdminDashboardProps | AgentDashboardProps;
