'use server';

import { createClient } from '@/lib/supabase';

export async function getFunnelData(searchParams: { [key: string]: string | undefined }) {
    const supabase = createClient();

    // 1. Nettoyage des filtres
    let campaign = searchParams.campaign;
    if (campaign) campaign = decodeURIComponent(campaign).replace(/\+/g, ' ');

    const platform = searchParams.platform;
    const from = searchParams.from;
    const to = searchParams.to;

    // 2. Requête Supabase (Vraies Données)
    let query = supabase.from('campaign_metrics').select('*');

    if (campaign && campaign !== 'all') query = query.eq('campaign_name', campaign);
    if (platform && platform !== 'all') query = query.ilike('source', `%${platform}%`);
    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching funnel data:', error);
        return null;
    }

    // 3. Agrégation des Vraies Données
    const realMetrics = (data || []).reduce((acc, row) => ({
        impressions: acc.impressions + (Number(row.impressions) || 0),
        clicks: acc.clicks + (Number(row.clicks) || 0),
        cost: acc.cost + (Number(row.cost) || 0),
        leads: acc.leads + (Number(row.leads) || 0), // Using 'leads' column as per previous debug/dashboard logic
    }), { impressions: 0, clicks: 0, cost: 0, leads: 0 });

    // 4. Calcul des Données Simulées (Règles Métier)
    const sessions = Math.round(realMetrics.clicks * 0.95);
    const bounceRate = 65; // 65% fixe
    const qualifiedLeads = Math.round(realMetrics.leads * 0.40);
    const appointments = Math.round(qualifiedLeads * 0.50);
    const sales = Math.round(appointments * 0.20);

    // 5. Calcul des KPIs dérivés
    const cpm = realMetrics.impressions > 0 ? (realMetrics.cost / realMetrics.impressions) * 1000 : 0;
    const ctr = realMetrics.impressions > 0 ? (realMetrics.clicks / realMetrics.impressions) * 100 : 0;
    const cpl = realMetrics.leads > 0 ? realMetrics.cost / realMetrics.leads : 0;
    const conversionRate = realMetrics.clicks > 0 ? (realMetrics.leads / realMetrics.clicks) * 100 : 0;
    const cac = sales > 0 ? realMetrics.cost / sales : 0;

    // 6. Construction de l'Objet Funnel
    return {
        stage1_awareness: {
            label: "Notoriété",
            impressions: realMetrics.impressions,
            cost: realMetrics.cost,
            cpm: cpm
        },
        stage2_traffic: {
            label: "Trafic Site",
            clicks: realMetrics.clicks,
            sessions: sessions,
            ctr: ctr,
            bounceRate: bounceRate
        },
        stage3_acquisition: {
            label: "Lead Gen",
            leads: realMetrics.leads,
            cpl: cpl,
            conversionRate: conversionRate
        },
        stage4_business: {
            label: "Ventes CRM",
            qualifiedLeads: qualifiedLeads,
            appointments: appointments,
            sales: sales,
            cac: cac
        }
    };
}

export async function getFunnelCampaignList() {
    const supabase = createClient();
    const { data } = await supabase.from('campaign_metrics').select('campaign_name');
    // @ts-ignore
    return Array.from(new Set(data?.map(i => i.campaign_name))).sort();
}
