export type CampaignStatus = 'active' | 'paused' | 'completed';
export type Platform = 'google' | 'meta' | 'linkedin';

export interface Campaign {
    id: string;
    name: string;
    platform: Platform;
    status: CampaignStatus;
    spent: number;
    clicks: number;
    impressions: number;
}

export interface ProgramStats {
    total_budget: number;
    spent_budget: number;
    leads: number;
    appointments: number; // RDV qualifiés
    cpl: number; // Coût par lead
    sales: number; // Actes signés
}

export interface RealEstateProgram {
    id: string;
    name: string; // Ex: "Résidence Les Cèdres"
    location: string;
    promoter_name: string;
    status: 'marketing' | 'construction' | 'delivered';
    stats: ProgramStats;
    campaigns: Campaign[];
    // Pour le graphique d'historique
    history: {
        month: string;
        leads: number;
        appointments: number;
    }[];
}
