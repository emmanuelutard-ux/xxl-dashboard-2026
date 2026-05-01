'use server'

import { getMetaAccessToken } from '@/utils/metaAuth'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { META_GRAPH_BASE_URL } from './config'

export type MetaCampaignListResult = {
    success:    boolean
    campaigns?: Array<{
        campaign_id:      string
        nom:              string
        status:           string   // 'ACTIVE', 'PAUSED', 'ARCHIVED'
        objective:        string   // 'OUTCOME_LEADS', 'LEAD_GENERATION', etc.
        daily_budget_eur: number | null   // daily_budget (centimes) / 100, null si non défini
        is_linked:        boolean
    }>
    error?: string
}

function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        throw new Error('[listMetaCampaigns] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
    }
    return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

export async function listMetaCampaigns(
    adAccountId: string,   // "act_1234567890"
    programmeId: string
): Promise<MetaCampaignListResult> {
    console.log(`[listMetaCampaigns] Démarrage — adAccountId: ${adAccountId}, programmeId: ${programmeId}`)

    try {
        const accessToken = await getMetaAccessToken()
        const supabase    = createAdminClient()

        const params = new URLSearchParams({
            fields:       'id,name,status,objective,daily_budget,lifetime_budget',
            limit:        '200',
            access_token: accessToken,
        })

        const [apiRes, { data: linkedRows, error: dbErr }] = await Promise.all([
            fetch(`${META_GRAPH_BASE_URL}/${adAccountId}/campaigns?${params.toString()}`, { cache: 'no-store' }),
            supabase
                .from('meta_ads_campaigns')
                .select('campaign_id')
                .eq('programme_id', programmeId),
        ])

        const apiData = await apiRes.json() as Record<string, unknown>

        console.log(`[listMetaCampaigns] API Meta — status: ${apiRes.status}`)

        if (!apiRes.ok) {
            const errObj = apiData.error as Record<string, unknown> | undefined
            console.error('[listMetaCampaigns] Erreur API Meta:', apiData.error ?? apiData)
            return { success: false, error: String(errObj?.message ?? `Erreur API Meta (status ${apiRes.status})`) }
        }

        if (dbErr) {
            console.error('[listMetaCampaigns] Erreur Supabase:', dbErr.message)
            return { success: false, error: `Erreur lecture base de données : ${dbErr.message}` }
        }

        const rawCampaigns = (apiData.data ?? []) as Record<string, unknown>[]
        const linkedIds    = new Set((linkedRows ?? []).map((r) => r.campaign_id))

        console.log(`[listMetaCampaigns] ${rawCampaigns.length} campagne(s) brutes reçues`)

        const campaigns = rawCampaigns
            .filter((c) => String(c.status ?? '') !== 'DELETED' && c.id)
            .map((c) => {
                const dailyBudgetCents = Number(c.daily_budget ?? 0)
                return {
                    campaign_id:      String(c.id),
                    nom:              String(c.name ?? ''),
                    status:           String(c.status ?? ''),
                    objective:        String(c.objective ?? ''),
                    daily_budget_eur: dailyBudgetCents > 0 ? dailyBudgetCents / 100 : null,
                    is_linked:        linkedIds.has(String(c.id)),
                }
            })

        console.log(
            `[listMetaCampaigns] ${campaigns.length} campagne(s) actives, ` +
            `${campaigns.filter((c) => c.is_linked).length} liée(s) au programme`
        )

        return { success: true, campaigns }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        console.error('[listMetaCampaigns] ERREUR:', message)
        return { success: false, error: message }
    }
}
