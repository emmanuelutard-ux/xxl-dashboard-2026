import { supabase } from "@/lib/supabase";
import { CampaignMetric } from "@/types/database";
import { MOCK_PROGRAMS } from "@/data/mockData";

export async function getRealDashboardData(programId: string) {
    try {
        const { data, error } = await supabase
            .from('campaign_metrics')
            .select('*')
            .eq('program_id', programId);

        if (error || !data || data.length === 0) {
            console.warn("Supabase fetch failed or empty, using mock data:", error);
            return getMockData(programId);
        }

        return aggregateMetrics(data as CampaignMetric[]);
    } catch (e) {
        console.error("Error in getRealDashboardData:", e);
        return getMockData(programId);
    }
}

function getMockData(programId: string) {
    const program = MOCK_PROGRAMS.find(p => p.id === programId) || MOCK_PROGRAMS[0];

    // Return structure matching what the dashboard expects
    // For now, we'll just return the stats object from the mock
    // In a real scenario, we might want to shape this to match the aggregated DB result exactly
    return {
        spent: program.stats.spent_budget,
        impressions: 450000, // Hardcoded mock value from dashboard
        clicks: 3200, // Hardcoded mock value from dashboard
        leads: program.stats.leads,
        cpl: program.stats.cpl,
        // Add other derived metrics if needed by the consumer, 
        // but usually the consumer calculates rates (CTR, Conv Rate)
    };
}

function aggregateMetrics(metrics: CampaignMetric[]) {
    const aggregated = metrics.reduce((acc, curr) => ({
        spent: acc.spent + curr.cost,
        impressions: acc.impressions + curr.impressions,
        clicks: acc.clicks + curr.clicks,
        leads: acc.conversions + curr.conversions, // Assuming conversions = leads
    }), { spent: 0, impressions: 0, clicks: 0, leads: 0 });

    return {
        ...aggregated,
        cpl: aggregated.leads > 0 ? aggregated.spent / aggregated.leads : 0,
    };
}
