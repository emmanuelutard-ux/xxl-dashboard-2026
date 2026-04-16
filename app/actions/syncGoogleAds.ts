'use server'

import { getGoogleAccessToken } from '@/utils/googleAuth'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const MCC_ID = '8667313568'

// Client admin — bypasse le RLS via la service role key
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

  console.log(`[syncGoogleAds] Appel API Google Ads — customer: ${customerId}`)

  const res = await fetch(
    `https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`,
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

  console.log(`[syncGoogleAds] Réponse API Google Ads — status: ${res.status}`)

  if (!res.ok) {
    const err = await res.text()
    console.error(`[syncGoogleAds] Erreur API Google Ads (${customerId}):`, err)
    throw new Error(`Google Ads API error (customer ${customerId}): ${err}`)
  }

  const data = await res.json()
  console.log(`[syncGoogleAds] Réponse brute (premiers 500 chars):`, JSON.stringify(data).slice(0, 500))

  const results: unknown[] = data.results ?? []

  console.log(`[syncGoogleAds] Résultats bruts reçus: ${results.length} lignes`)

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

  const aggregated = [...byDate.values()]
  console.log(`[syncGoogleAds] Après agrégation: ${aggregated.length} jours distincts`)

  return aggregated
}

// ─── Server Action principale ─────────────────────────────────────────────────

export async function syncGoogleAds(programId?: string): Promise<SyncResult> {
  console.log(`[syncGoogleAds] Démarrage — programId reçu: ${programId ?? '(aucun)'}`)

  try {
    const { accessToken, developerToken } = await getGoogleAccessToken()
    console.log('[syncGoogleAds] Access token obtenu')

    const supabase = createAdminClient()
    console.log('[syncGoogleAds] Client Supabase admin initialisé (service role)')

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

    console.log('[syncGoogleAds] Résultat requête google_ads_accounts:', {
      accounts,
      error: accErr?.message ?? null,
    })

    if (accErr) throw new Error(`Erreur récupération comptes: ${accErr.message}`)

    if (!accounts || accounts.length === 0) {
      console.warn('[syncGoogleAds] Aucun compte trouvé — programme_id non lié ou table vide')
      return {
        success: false,
        message: 'Aucun compte Google Ads lié à ce programme. Vérifiez la liaison dans google_ads_accounts.',
        inserted: 0,
      }
    }

    console.log(`[syncGoogleAds] ${accounts.length} compte(s) trouvé(s):`, accounts.map(a => a.customer_id))

    let totalInserted = 0

    for (const account of accounts) {
      console.log(`[syncGoogleAds] Traitement compte: ${account.customer_id} — nom: ${account.nom}`)

      const rows = await fetchGoogleAdsDailyMetrics(
        account.customer_id,
        accessToken,
        developerToken
      )

      if (rows.length === 0) {
        console.log(`[syncGoogleAds] Aucune donnée pour ${account.customer_id}, on passe`)
        continue
      }

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

      console.log(`[syncGoogleAds] Upsert de ${upsertData.length} lignes pour programme ${account.programme_id}`)

      const { error: upsertErr } = await supabase
        .from('daily_ad_metrics')
        .upsert(upsertData, { onConflict: 'program_id,date,platform' })

      if (upsertErr) {
        console.error(`[syncGoogleAds] Erreur upsert (${account.customer_id}):`, upsertErr.message)
        throw new Error(`Erreur upsert (${account.customer_id}): ${upsertErr.message}`)
      }

      console.log(`[syncGoogleAds] Upsert OK pour ${account.customer_id}`)
      totalInserted += rows.length
    }

    console.log(`[syncGoogleAds] Terminé — ${totalInserted} jours insérés/mis à jour`)

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
