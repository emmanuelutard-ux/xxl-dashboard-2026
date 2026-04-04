import { createClient } from './supabase';

interface DateRange {
    from: string;
    to: string;
}

export interface ProgramStatsResult {
    programId: string;
    period: DateRange;
    conversionSource: 'platform' | 'ga4';
    totalSpend: number;
    totalLeads: number;
    cpl: number;
}

/**
 * Calcule les statistiques consolidées d'un programme sur une période donnée.
 * Applique la règle "Data Critique" : le choix de la source de conversion (Platform vs GA4)
 * impacte directement le calcul du nombre de leads et donc du CPL.
 */
export async function getProgramStats(programId: string, range: DateRange): Promise<ProgramStatsResult> {
    const supabase = createClient();

    // 1. Récupérer la configuration du programme (pour savoir quelle source utiliser)
    const { data: program, error: programError } = await supabase
        .from('real_estate_programs')
        .select('conversion_source')
        .eq('id', programId)
        .single();

    if (programError || !program) {
        console.error('getProgramStats Error:', programError);
        throw new Error(`Programme introuvable ou erreur DB: ${programError?.message}`);
    }

    // 2. Récupérer les métriques brutes sur la période
    const { data: metrics, error: metricsError } = await supabase
        .from('daily_ad_metrics')
        .select('spend, platform_conversions, ga4_conversions')
        .eq('program_id', programId)
        .gte('date', range.from)
        .lte('date', range.to);

    if (metricsError) {
        console.error('getProgramStats Metrics Error:', metricsError);
        throw new Error(`Erreur récupération métriques: ${metricsError.message}`);
    }

    // 3. Calculer les totaux
    const totalSpend = (metrics || []).reduce((sum, row) => sum + (Number(row.spend) || 0), 0);

    // LOGIQUE CRITIQUE : Choix de la colonne selon la config du programme
    const totalLeads = (metrics || []).reduce((sum, row) => {
        const val = program.conversion_source === 'ga4'
            ? row.ga4_conversions
            : row.platform_conversions;
        return sum + (Number(val) || 0);
    }, 0);

    const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;

    return {
        programId,
        period: range,
        conversionSource: program.conversion_source as 'platform' | 'ga4',
        totalSpend,
        totalLeads,
        cpl: parseFloat(cpl.toFixed(2)) // Arrondi propre pour l'affichage
    };
}
