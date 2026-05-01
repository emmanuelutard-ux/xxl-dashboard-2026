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

    // Appels en parallèle : liste des customers accessibles + comptes déjà liés en base
    const [accessibleRes, { data: linkedRows, error: dbErr }] = await Promise.all([
      fetch(
        `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers:listAccessibleCustomers`,
        {
          method: 'GET',
          headers: {
            'Authorization':   `Bearer ${accessToken}`,
            'developer-token': developerToken.trim(),
          },
          cache: 'no-store',
        }
      ),
      supabase
        .from('google_ads_accounts')
        .select('customer_id, programme_id, real_estate_programs(name)')
        .not('programme_id', 'is', null),
    ])

    console.log(`[listAvailableGoogleAdsAccounts] listAccessibleCustomers — status: ${accessibleRes.status}`)

    if (!accessibleRes.ok) {
      const raw = await accessibleRes.text()
      if (raw.trimStart().startsWith('<')) {
        console.error('[listAvailableGoogleAdsAccounts] Réponse HTML reçue')
        return { success: false, error: `L'API Google Ads a renvoyé une page HTML (status ${accessibleRes.status}). Vérifiez la version de l'API.` }
      }
      console.error('[listAvailableGoogleAdsAccounts] Erreur listAccessibleCustomers:', raw.slice(0, 500))
      return { success: false, error: `Erreur API Google Ads (status ${accessibleRes.status}).` }
    }

    if (dbErr) {
      console.error('[listAvailableGoogleAdsAccounts] Erreur Supabase:', dbErr.message)
      return { success: false, error: `Erreur lecture base de données : ${dbErr.message}` }
    }

    const accessibleData = await accessibleRes.json()
    const resourceNames: string[] = accessibleData.resourceNames ?? []
    const customerIds = resourceNames.map((r) => r.replace('customers/', ''))

    console.log(`[listAvailableGoogleAdsAccounts] ${customerIds.length} customer(s) accessible(s)`)

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

    // Récupérer le nom descriptif de chaque customer via GAQL (en parallèle, skip si erreur)
    const nameResults = await Promise.allSettled(
      customerIds.map(async (customerId) => {
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
            body: JSON.stringify({
              query: 'SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1',
            }),
            cache: 'no-store',
          }
        )
        if (!res.ok) {
          const err = await res.text()
          throw new Error(`HTTP ${res.status}: ${err.slice(0, 100)}`)
        }
        const data = await res.json()
        const result = data.results?.[0]
        return {
          customer_id: customerId,
          nom:         String(result?.customer?.descriptiveName ?? customerId),
        }
      })
    )

    const failures = nameResults.filter((r) => r.status === 'rejected')
    if (failures.length > 0) {
      console.warn(`[listAvailableGoogleAdsAccounts] ${failures.length} compte(s) ignoré(s) (inaccessibles)`)
    }

    const accounts: AvailableAccount[] = nameResults
      .filter(
        (r): r is PromiseFulfilledResult<{ customer_id: string; nom: string }> =>
          r.status === 'fulfilled'
      )
      .map((r) => {
        const linked = linkedMap.get(r.value.customer_id)
        return {
          customer_id:           r.value.customer_id,
          nom:                   r.value.nom,
          is_linked:             !!linked,
          linked_programme_id:   linked?.programme_id,
          linked_programme_name: linked?.nom_programme,
        }
      })

    console.log(`[listAvailableGoogleAdsAccounts] ${accounts.length} compte(s) retourné(s)`)

    return { success: true, accounts }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[listAvailableGoogleAdsAccounts] ERREUR:', message)
    return { success: false, error: message }
  }
}
