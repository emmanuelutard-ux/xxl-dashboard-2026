'use server';

import { createClient } from '@/lib/supabase';

export async function getDebugMetrics(searchParams: { [key: string]: string | undefined }) {
    const supabase = createClient();
    const logs: string[] = [];

    // 1. Nettoyage des filtres
    let campaign = searchParams.campaign;
    if (campaign) campaign = decodeURIComponent(campaign).replace(/\+/g, ' ');

    const platform = searchParams.platform; // Nouveau filtre
    const from = searchParams.from;
    const to = searchParams.to;

    // 2. Requête Supabase
    let query = supabase.from('campaign_metrics').select('*');

    if (campaign && campaign !== 'all') {
        // Recherche toutes les campagnes qui contiennent ce mot (ex: "Gentilly")
        query = query.ilike('campaign_name', `%${campaign}%`);
    }
    if (platform && platform !== 'all') query = query.ilike('source', `%${platform}%`); // ilike pour gérer Google Ads / google
    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);

    // TRI CRUCIAL pour le graphique (Ancien -> Récent)
    const { data, error } = await query.order('date', { ascending: true });

    if (error) return { metrics: null, rawData: [], campaignsBreakdown: [], logs: [error.message] };

    // 3. Calculs Globaux
    const metrics = (data || []).reduce((acc, row) => ({
        totalSpent: acc.totalSpent + (Number(row.cost) || 0),
        totalImpressions: acc.totalImpressions + (Number(row.impressions) || 0),
        totalClicks: acc.totalClicks + (Number(row.clicks) || 0),
        totalLeads: acc.totalLeads + (Number(row.leads) || 0),
        count: acc.count + 1
    }), { totalSpent: 0, totalImpressions: 0, totalClicks: 0, totalLeads: 0, count: 0 });

    // 4. Calcul par Campagne (Pour le tableau du bas)
    const breakdownMap = new Map();
    (data || []).forEach(row => {
        const name = row.campaign_name;
        if (!breakdownMap.has(name)) {
            breakdownMap.set(name, { name, source: row.source, spent: 0, leads: 0, clicks: 0, impressions: 0 });
        }
        const item = breakdownMap.get(name);
        item.spent += Number(row.cost) || 0;
        item.leads += Number(row.leads) || 0;
        item.clicks += Number(row.clicks) || 0;
        item.impressions += Number(row.impressions) || 0;
    });
    const campaignsBreakdown = Array.from(breakdownMap.values());

    return { metrics, rawData: data || [], campaignsBreakdown, logs };
}

// Helper pour la liste
export async function getDebugCampaignList() {
    const supabase = createClient();
    const { data } = await supabase.from('campaign_metrics').select('campaign_name');

    const programs = new Set<string>();

    (data || []).forEach(item => {
        let name = item.campaign_name;

        // NETTOYAGE INTELLIGENT :
        // 1. Retire les préfixes comme "AIC - "
        name = name.replace(/^AIC\s?-\s?/i, '');

        // 2. Retire les suffixes techniques courants (BRS, Pmax, dates...)
        // On garde juste le premier "mot clé" principal (souvent la Ville)
        // Exemple : "Gentilly BRS - Nov 2025" -> "Gentilly"
        // Stratégie : On coupe au premier tiret restant ou mot clé technique
        const parts = name.split(/[\s-](BRS|Pmax|Nov|Oct|Sep|Dec|Jan|Fev|Mar|Avr|Mai|Juin|Juil|Aout)/i);

        // On prend le premier morceau propre et on trim
        const programName = parts[0].trim();

        if (programName.length > 2) { // Évite les bugs de noms trop courts
            programs.add(programName);
        }
    });
    return Array.from(programs).sort();
}
