import { createClient } from '@/lib/supabase';

export async function getRealMetrics(searchParams: { [key: string]: string | undefined }) {
    const supabase = createClient();

    // 1. Nettoyage des filtres (Comme dans le Debug)
    let campaign = searchParams?.campaign;
    if (campaign) {
        campaign = decodeURIComponent(campaign).replace(/\+/g, ' ');
    }
    const from = searchParams?.from;
    const to = searchParams?.to;

    // 2. Requête Supabase
    let query = supabase.from('campaign_metrics').select('*');

    if (campaign && campaign !== 'all') {
        query = query.eq('campaign_name', campaign);
    }
    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);

    const { data, error } = await query.order('date', { ascending: true });

    if (error) {
        console.error('Erreur DB:', error);
        return {
            totalSpent: 0,
            totalImpressions: 0,
            totalClicks: 0,
            totalLeads: 0,
            ctr: 0,
            cpc: 0,
            cpl: 0,
            conversionRate: 0,
            history: []
        };
    }

    // 3. Calculs Robustes (Conversion Number() obligatoire)
    const metrics = (data || []).reduce((acc, row) => {
        const cost = Number(row.cost) || 0;
        const imps = Number(row.impressions) || 0;
        const clicks = Number(row.clicks) || 0;
        // Adaptation: 'conversions' column in DB maps to 'leads' in dashboard
        const leads = Number(row.conversions) || 0;

        return {
            totalSpent: acc.totalSpent + cost,
            totalImpressions: acc.totalImpressions + imps,
            totalClicks: acc.totalClicks + clicks,
            totalLeads: acc.totalLeads + leads
        };
    }, { totalSpent: 0, totalImpressions: 0, totalClicks: 0, totalLeads: 0 });

    // 4. Calcul des Ratios
    const ctr = metrics.totalImpressions > 0 ? (metrics.totalClicks / metrics.totalImpressions) * 100 : 0;
    const cpc = metrics.totalClicks > 0 ? metrics.totalSpent / metrics.totalClicks : 0;
    const cpl = metrics.totalLeads > 0 ? metrics.totalSpent / metrics.totalLeads : 0;
    const conversionRate = metrics.totalClicks > 0 ? (metrics.totalLeads / metrics.totalClicks) * 100 : 0;

    // 5. Préparation Historique pour le Graphique
    const historyMap = new Map();
    (data || []).forEach((row) => {
        // Format Date JJ/MM pour l'affichage
        const dateObj = new Date(row.date);
        if (isNaN(dateObj.getTime())) return;

        const dateKey = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;

        if (!historyMap.has(dateKey)) {
            historyMap.set(dateKey, { date: dateKey, leads: 0, appointments: 0 });
        }
        const entry = historyMap.get(dateKey);
        entry.leads += Number(row.conversions) || 0;
    });

    return { ...metrics, ctr, cpc, cpl, conversionRate, history: Array.from(historyMap.values()) };
}

export async function getCampaignList() {
    const supabase = createClient();
    const { data } = await supabase.from('campaign_metrics').select('campaign_name');
    // @ts-ignore
    return Array.from(new Set(data?.map(i => i.campaign_name))).sort();
}
