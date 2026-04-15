'use server'

import { getGoogleAccessToken } from '@/utils/googleAuth'
import { createClient } from '@/lib/supabase'

const MCC_ID = '8667313568'

interface DailyRow {
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

// ─── Appel Google Ads API v19 (GAQL) ─────────────────────────────────────────

async function fetchGoogleAdsDailyMetrics(
  customerId: string,
  accessToken: string,
  developerToken: string
): Promise<DailyRow[]> {
  const query = `
    SELECT
      segments.date,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY segments.date DESC
  `

  const res = await fetch(
    `https://googleads.googleapis.com/v19/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        'Authorization':      `Bearer ${accessToken}`,
        'developer-token':    developerToken.trim(),
        'login-customer-id':  MCC_ID,
        'Content-Type':       'application/json',
      },
      body: JSON.stringify({ query }),
      cache: 'no-store',
    }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Google Ads API error (customer ${customerId}): ${err}`)
  }

  const data = await res.json()
  const results: unknown[] = data.results ?? []

  // Agrégation par date — somme de toutes les campagnes du compte
  const byDate = new Map<string, DailyRow>()

  for (const row of results) {
    const r = row as Record<string, Record<string, unknown>>
    const date = (r.segments?.date as string) ?? ''
    if (!date) continue

    const existing = byDate.get(date) ?? {
      date,
      costMicros:  0,
      clicks:      0,
      impressions: 0,
      conversions: 0,
    }

    existing.costMicros  += Number(r.metrics?.costMicros  ?? 0)
    existing.clicks      += Number(r.metrics?.clicks      ?? 0)
    existing.impressions += Number(r.metrics?.impressions ?? 0)
    existing.conversions += Number(r.metrics?.conversions ?? 0)

    byDate.set(date, existing)
  }

  return [...byDate.values()]
}

// ─── Server Action principale ─────────────────────────────────────────────────

export async function syncGoogleAds(programId?: string): Promise<SyncResult> {
  try {
    const { accessToken, developerToken } = await getGoogleAccessToken()
    const supabase = createClient()

    // Récupérer les comptes actifs liés au programme demandé (ou tous si pas de programId)
    let accountsQuery = supabase
      .from('google_ads_accounts')
      .select('customer_id, programme_id, nom')
      .eq('is_active', true)

    if (programId) {
      accountsQuery = accountsQuery.eq('programme_id', programId)
    } else {
      accountsQuery = accountsQuery.not('programme_id', 'is', null)
    }

    const { data: accounts, error: accErr } = await accountsQuery

    if (accErr) throw new Error(`Erreur récupération comptes: ${accErr.message}`)

    if (!accounts || accounts.length === 0) {
      return {
        success: false,
        message: 'Aucun compte Google Ads lié à ce programme. Vérifiez la liaison dans google_ads_accounts.',
        inserted: 0,
      }
    }

    let totalInserted = 0

    for (const account of accounts) {
      const rows = await fetchGoogleAdsDailyMetrics(
        account.customer_id,
        accessToken,
        developerToken
      )

      if (rows.length === 0) continue

      const upsertData = rows.map((r) => ({
        program_id:           account.programme_id as string,
        date:                 r.date,
        platform:             'google' as const,
        spend:                r.costMicros / 1_000_000,
        clicks:               r.clicks,
        impressions:          r.impressions,
        platform_conversions: Math.round(r.conversions),
        ga4_conversions:      0,
      }))

      const { error: upsertErr } = await supabase
        .from('daily_ad_metrics')
        .upsert(upsertData, { onConflict: 'program_id,date,platform' })

      if (upsertErr) {
        throw new Error(`Erreur upsert (${account.customer_id}): ${upsertErr.message}`)
      }

      totalInserted += rows.length
    }

    return {
      success: true,
      message: `Synchronisation réussie — ${totalInserted} jours importés.`,
      inserted: totalInserted,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[syncGoogleAds]', message)
    return { success: false, message, inserted: 0 }
  }
}
