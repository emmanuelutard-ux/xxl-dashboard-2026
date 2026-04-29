'use server'

import { getGoogleAccessToken } from '@/utils/googleAuth'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { GOOGLE_ADS_API_VERSION } from './config'

const MCC_ID = '8667313568'

export type CampaignListResult = {
  success: boolean
  campaigns?: Array<{
    campaign_id:      string
    nom:              string
    type:             string          // 'SEARCH', 'PERFORMANCE_MAX', 'DISPLAY', etc.
    status:           string          // 'ENABLED', 'PAUSED'
    daily_budget_eur: number | null   // amount_micros / 1_000_000, null si non renseigné
    is_linked:        boolean         // déjà liée au programmeId courant
  }>
  error?: string
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('[listGoogleAdsCampaigns] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  })
}

export async function listGoogleAdsCampaigns(
  customerId: string,
  programmeId: string
): Promise<CampaignListResult> {
  console.log(`[listGoogleAdsCampaigns] Démarrage — customerId: ${customerId}, programmeId: ${programmeId}`)

  try {
    const { accessToken, developerToken } = await getGoogleAccessToken()

    if (!developerToken) {
      return { success: false, error: 'Developer token manquant — vérifiez la configuration Google Ads.' }
    }

    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros
      FROM campaign
      WHERE campaign.status != 'REMOVED'
      ORDER BY campaign.name
    `

    const supabase = createAdminClient()

    // Appels en parallèle : API Google Ads + campagnes déjà liées en base
    const [apiRes, { data: linkedRows, error: dbErr }] = await Promise.all([
      fetch(
        `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${customerId}/googleAds:search`,
        {
          method: 'POST',
          headers: {
            'Authorization':     `Bearer ${accessToken}`,
            'developer-token':   developerToken.trim(),
            'login-customer-id': MCC_ID,
            'Content-Type':      'application/json',
          },
          body: JSON.stringify({ query }),
          cache: 'no-store',
        }
      ),
      supabase
        .from('google_ads_campaigns')
        .select('campaign_id')
        .eq('programme_id', programmeId),
    ])

    console.log(`[listGoogleAdsCampaigns] Réponse API — status: ${apiRes.status}`)

    if (!apiRes.ok) {
      const raw = await apiRes.text()
      if (raw.trimStart().startsWith('<')) {
        console.error(`[listGoogleAdsCampaigns] L'API a renvoyé du HTML (status ${apiRes.status}) — version ou endpoint incorrect`)
        return {
          success: false,
          error: `L'API Google Ads a renvoyé une page HTML (status ${apiRes.status}). Vérifiez la version de l'API ou l'ID du compte.`,
        }
      }
      console.error(`[listGoogleAdsCampaigns] Erreur API (${customerId}):`, raw.slice(0, 500))
      return {
        success: false,
        error: `Erreur API Google Ads (status ${apiRes.status}) : ${raw.slice(0, 200)}`,
      }
    }

    if (dbErr) {
      console.error('[listGoogleAdsCampaigns] Erreur Supabase:', dbErr.message)
      return { success: false, error: `Erreur lecture base de données : ${dbErr.message}` }
    }

    const data = await apiRes.json()
    const results: unknown[] = data.results ?? []

    console.log(`[listGoogleAdsCampaigns] ${results.length} campagne(s) reçue(s) depuis l'API`)

    // Index des campaign_id déjà liées au programme
    const linkedIds = new Set((linkedRows ?? []).map((r) => r.campaign_id))

    const campaigns = results.map((row) => {
      const r          = row as Record<string, Record<string, unknown>>
      const campaignId = String(r.campaign?.id ?? '')
      const amountMicros = Number(r.campaignBudget?.amountMicros ?? 0)

      return {
        campaign_id:      campaignId,
        nom:              String(r.campaign?.name ?? ''),
        type:             String(r.campaign?.advertisingChannelType ?? ''),
        status:           String(r.campaign?.status ?? ''),
        daily_budget_eur: amountMicros > 0 ? amountMicros / 1_000_000 : null,
        is_linked:        linkedIds.has(campaignId),
      }
    })

    console.log(
      `[listGoogleAdsCampaigns] Terminé — ${campaigns.length} campagnes, ` +
      `${campaigns.filter((c) => c.is_linked).length} liées au programme`
    )

    return { success: true, campaigns }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[listGoogleAdsCampaigns] ERREUR:', message)
    return { success: false, error: message }
  }
}
