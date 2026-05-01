'use server'

import { getGoogleAccessToken } from '@/utils/googleAuth'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { GOOGLE_ADS_API_VERSION } from './config'

const MCC_ID = '8667313568'

export type AvailableAccount = {
  customer_id: string
  nom: string
  is_linked: boolean
  linked_programme_id?: string
  linked_programme_name?: string
}

export type ListAvailableAccountsResult = {
  success: boolean
  accounts?: AvailableAccount[]
  error?: string
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('[listAvailableGoogleAdsAccounts] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  }
  return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

export async function listAvailableGoogleAdsAccounts(): Promise<ListAvailableAccountsResult> {
  console.log('[listAvailableGoogleAdsAccounts] Démarrage')

  try {
    const { accessToken, developerToken } = await getGoogleAccessToken()
    if (!developerToken) {
      return { success: false, error: 'Developer token manquant — vérifiez la configuration Google Ads.' }
    }

    const supabase = createAdminClient()

    // Appels en parallèle : sous-comptes du MCC via GAQL + comptes déjà liés en base
    const [mccRes, { data: linkedRows, error: dbErr }] = await Promise.all([
      fetch(
        `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${MCC_ID}/googleAds:search`,
        {
          method: 'POST',
          headers: {
            'Authorization':     `Bearer ${accessToken}`,
            'developer-token':   developerToken.trim(),
            'login-customer-id': MCC_ID,
            'Content-Type':      'application/json',
          },
          body: JSON.stringify({
            query: "SELECT customer_client.client_customer, customer_client.descriptive_name, customer_client.id, customer_client.manager, customer_client.status FROM customer_client WHERE customer_client.status = 'ENABLED'",
          }),
          cache: 'no-store',
        }
      ),
      supabase
        .from('google_ads_accounts')
        .select('customer_id, programme_id, real_estate_programs(name)')
        .not('programme_id', 'is', null),
    ])

    console.log(`[listAvailableGoogleAdsAccounts] customer_client GAQL — status: ${mccRes.status}`)

    if (!mccRes.ok) {
      const raw = await mccRes.text()
      if (raw.trimStart().startsWith('<')) {
        console.error('[listAvailableGoogleAdsAccounts] Réponse HTML reçue')
        return { success: false, error: `L'API Google Ads a renvoyé une page HTML (status ${mccRes.status}). Vérifiez la version de l'API.` }
      }
      console.error('[listAvailableGoogleAdsAccounts] Erreur GAQL MCC:', raw.slice(0, 500))
      return { success: false, error: `Erreur API Google Ads (status ${mccRes.status}).` }
    }

    if (dbErr) {
      console.error('[listAvailableGoogleAdsAccounts] Erreur Supabase:', dbErr.message)
      return { success: false, error: `Erreur lecture base de données : ${dbErr.message}` }
    }

    const mccData = await mccRes.json()
    const results: unknown[] = mccData.results ?? []
    console.log(`[listAvailableGoogleAdsAccounts] ${results.length} ligne(s) brutes reçues du MCC`)

    // Construire le map des liaisons existantes depuis Supabase
    type LinkedRow = {
      customer_id: string
      programme_id: string | null
      real_estate_programs: { name: string } | null
    }
    const rows = (linkedRows ?? []) as unknown as LinkedRow[]
    const linkedMap = new Map<string, { programme_id: string; nom_programme: string }>()
    for (const row of rows) {
      if (row.programme_id) {
        linkedMap.set(row.customer_id, {
          programme_id:  row.programme_id,
          nom_programme: row.real_estate_programs?.name ?? 'Programme inconnu',
        })
      }
    }

    // Construire la liste des sous-comptes (hors MCC lui-même et sous-MCC)
    const accounts: AvailableAccount[] = []

    for (const item of results) {
      const r  = item as Record<string, Record<string, unknown>>
      const cc = r.customerClient ?? {}

      const customerId = String(cc.id ?? '')
      const isManager  = cc.manager === true
      const nom        = String(cc.descriptiveName ?? customerId)

      if (!customerId || customerId === MCC_ID || isManager) continue

      const linked = linkedMap.get(customerId)
      accounts.push({
        customer_id:           customerId,
        nom,
        is_linked:             !!linked,
        linked_programme_id:   linked?.programme_id,
        linked_programme_name: linked?.nom_programme,
      })
    }

    console.log(`[listAvailableGoogleAdsAccounts] ${accounts.length} sous-compte(s) retourné(s)`)

    return { success: true, accounts }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[listAvailableGoogleAdsAccounts] ERREUR:', message)
    return { success: false, error: message }
  }
}
