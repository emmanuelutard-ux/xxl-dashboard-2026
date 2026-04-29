'use server'

import { getGoogleAccessToken } from '@/utils/googleAuth'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { GOOGLE_ADS_API_VERSION } from './config'

const MCC_ID = '8667313568'

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('[syncGoogleAds] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  })
}

// Une ligne brute telle que renvoyée par l'API (une campagne, un jour)
interface RawRow {
  date: string
  campaignId: string
  costMicros: number
  clicks: number
  impressions: number
  conversions: number
}

// Ligne agrégée par (programme_id, date) après fusion multi-campagnes
interface AggregatedRow {
  programmeId: string
  date: string
  costMicros: number
  clicks: number
  impressions: number
  conversions: number
}

export interface SyncResult {
  success: boolean
  message: string
  inserted: number
}

// ─── Appel Google Ads API (GAQL) ──────────────────────────────────────────────

async function fetchGoogleAdsDailyMetrics(
  customerId: string,
  campaignIds: string[],
  accessToken: string,
  developerToken: string
): Promise<RawRow[]> {
  // campaign.id IN (...) — IDs numériques sans guillemets dans GAQL
  const idList = campaignIds.join(', ')

  const query = `
    SELECT
      segments.date,
      campaign.id,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
      AND campaign.id IN (${idList})
    ORDER BY segments.date DESC
  `

  console.log(`[syncGoogleAds] Appel API — customer: ${customerId}, campaigns: [${idList}]`)

  const res = await fetch(
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
  )

  console.log(`[syncGoogleAds] Réponse API — status: ${res.status}`)

  if (!res.ok) {
    const err = await res.text()
    console.error(`[syncGoogleAds] Erreur API (${customerId}):`, err)
    throw new Error(`Google Ads API error (customer ${customerId}): ${err}`)
  }

  const data = await res.json()
  console.log(`[syncGoogleAds] Réponse brute (premiers 500 chars):`, JSON.stringify(data).slice(0, 500))

  const results: unknown[] = data.results ?? []
  console.log(`[syncGoogleAds] ${results.length} ligne(s) brutes reçues`)

  return results
    .map((row) => {
      const r = row as Record<string, Record<string, unknown>>
      return {
        date:        String(r.segments?.date  ?? ''),
        campaignId:  String(r.campaign?.id    ?? ''),
        costMicros:  Number(r.metrics?.costMicros  ?? 0),
        clicks:      Number(r.metrics?.clicks      ?? 0),
        impressions: Number(r.metrics?.impressions ?? 0),
        conversions: Number(r.metrics?.conversions ?? 0),
      }
    })
    .filter((r) => r.date !== '')
}

// ─── Server Action principale ─────────────────────────────────────────────────

export async function syncGoogleAds(programId?: string): Promise<SyncResult> {
  console.log(`[syncGoogleAds] Démarrage — programId: ${programId ?? '(aucun)'}`)

  try {
    const { accessToken, developerToken } = await getGoogleAccessToken()
    if (!developerToken) throw new Error('Developer token manquant — vérifiez la configuration Google Ads.')
    console.log('[syncGoogleAds] Access token obtenu')

    const supabase = createAdminClient()

    // 1. Lire les campagnes liées depuis google_ads_campaigns + customer_id via JOIN
    type CampaignRow = {
      campaign_id: string
      programme_id: string
      google_ads_accounts: { id: string; customer_id: string } | null
    }

    let campaignsQuery = supabase
      .from('google_ads_campaigns')
      .select('campaign_id, programme_id, google_ads_accounts!inner(id, customer_id)')
      .eq('is_active', true)

    if (programId) {
      campaignsQuery = campaignsQuery.eq('programme_id', programId)
    }

    const { data: rawCampaigns, error: campErr } = await campaignsQuery

    if (campErr) throw new Error(`Erreur lecture google_ads_campaigns : ${campErr.message}`)

    const campaignRows = (rawCampaigns ?? []) as unknown as CampaignRow[]

    console.log(`[syncGoogleAds] ${campaignRows.length} campagne(s) liée(s) trouvée(s)`)

    if (campaignRows.length === 0) {
      console.warn('[syncGoogleAds] Aucune campagne liée — sync annulée')
      return {
        success: false,
        message: 'Aucune campagne liée à ce programme. Configurez les liaisons via Gérer les campagnes Google Ads.',
        inserted: 0,
      }
    }

    // 2. Grouper par customer_id (1 appel API par compte)
    interface AccountGroup {
      customerId: string
      campaigns: Array<{ campaignId: string; programmeId: string }>
    }

    const byAccount = new Map<string, AccountGroup>()

    for (const row of campaignRows) {
      const account = row.google_ads_accounts
      if (!account) continue
      const group = byAccount.get(account.customer_id) ?? { customerId: account.customer_id, campaigns: [] }
      group.campaigns.push({ campaignId: row.campaign_id, programmeId: row.programme_id })
      byAccount.set(account.customer_id, group)
    }

    console.log(`[syncGoogleAds] ${byAccount.size} compte(s) Google Ads à interroger`)

    // Cutoff pour le nettoyage : correspond au début de LAST_30_DAYS
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 30)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    let totalInserted = 0

    for (const { customerId, campaigns } of byAccount.values()) {
      const campaignIds      = campaigns.map((c) => c.campaignId)
      const campaignToProgId = new Map(campaigns.map((c) => [c.campaignId, c.programmeId]))

      const rawRows = await fetchGoogleAdsDailyMetrics(customerId, campaignIds, accessToken, developerToken)

      if (rawRows.length === 0) {
        console.log(`[syncGoogleAds] Aucune donnée pour le compte ${customerId}, on passe`)
        continue
      }

      // 3. Agréger par (programme_id, date) — fusion multi-campagnes
      const byProgDate = new Map<string, AggregatedRow>()

      for (const row of rawRows) {
        const programmeId = campaignToProgId.get(row.campaignId)
        if (!programmeId) {
          console.warn(`[syncGoogleAds] campaignId ${row.campaignId} absent du mapping, ignoré`)
          continue
        }
        const key      = `${programmeId}::${row.date}`
        const existing = byProgDate.get(key) ?? {
          programmeId,
          date:        row.date,
          costMicros:  0,
          clicks:      0,
          impressions: 0,
          conversions: 0,
        }
        existing.costMicros  += row.costMicros
        existing.clicks      += row.clicks
        existing.impressions += row.impressions
        existing.conversions += row.conversions
        byProgDate.set(key, existing)
      }

      // Regrouper par programme pour delete + insert séparés
      const byProgramme = new Map<string, AggregatedRow[]>()
      for (const agg of byProgDate.values()) {
        const arr = byProgramme.get(agg.programmeId) ?? []
        arr.push(agg)
        byProgramme.set(agg.programmeId, arr)
      }

      for (const [progId, aggRows] of byProgramme.entries()) {
        console.log(`[syncGoogleAds] Programme ${progId} — ${aggRows.length} jour(s) à insérer`)

        // 4. Supprimer les métriques google de la période pour éviter les fantômes
        const { error: delErr } = await supabase
          .from('daily_ad_metrics')
          .delete()
          .eq('program_id', progId)
          .eq('platform', 'google')
          .gte('date', cutoffStr)

        if (delErr) {
          console.error(`[syncGoogleAds] Erreur suppression (${progId}):`, delErr.message)
          throw new Error(`Erreur suppression métriques (${progId}) : ${delErr.message}`)
        }

        // 5. Insérer les nouvelles métriques
        const insertData = aggRows.map((r) => ({
          program_id:           progId,
          date:                 r.date,
          platform:             'google' as const,
          spend:                r.costMicros / 1_000_000,
          clicks:               r.clicks,
          impressions:          r.impressions,
          platform_conversions: Math.round(r.conversions),
          ga4_conversions:      0,
        }))

        const { error: insertErr } = await supabase
          .from('daily_ad_metrics')
          .insert(insertData)

        if (insertErr) {
          console.error(`[syncGoogleAds] Erreur insert (${progId}):`, insertErr.message)
          throw new Error(`Erreur insert (${progId}) : ${insertErr.message}`)
        }

        totalInserted += aggRows.length
        console.log(`[syncGoogleAds] ${aggRows.length} ligne(s) insérée(s) — programme ${progId}`)
      }
    }

    console.log(`[syncGoogleAds] Terminé — ${totalInserted} ligne(s) au total`)

    return {
      success: true,
      message: `Synchronisation réussie — ${totalInserted} jours importés.`,
      inserted: totalInserted,
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[syncGoogleAds] ERREUR:', message)
    return { success: false, message, inserted: 0 }
  }
}
