export interface CampaignMetric {
    id: string;
    program_id: string;
    campaign_name?: string;
    source: 'google' | 'meta';
    date: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
}
