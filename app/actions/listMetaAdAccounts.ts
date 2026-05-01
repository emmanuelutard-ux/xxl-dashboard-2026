'use server'

import { getMetaAccessToken } from '@/utils/metaAuth'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { META_GRAPH_BASE_URL } from './config'

export type MetaAdAccount = {
    id:             string   // "act_1234567890"
    account_id:     string   // "1234567890"
    name:           string
    business_id?:   string
    business_name?: string
    is_existing:    boolean  // déjà dans meta_ads_accounts
}

export type ListMetaAdAccountsResult = {
    success:   boolean
    accounts?: MetaAdAccount[]
    error?:    string
}

function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        throw new Error('[listMetaAdAccounts] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
    }
    return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

export async function listMetaAdAccounts(): Promise<ListMetaAdAccountsResult> {
    console.log('[listMetaAdAccounts] Démarrage')

    try {
        const accessToken = await getMetaAccessToken()
        const supabase    = createAdminClient()

        const params = new URLSearchParams({
            fields:       'id,name,account_id,business',
            limit:        '100',
            access_token: accessToken,
        })

        const [apiRes, { data: existingRows, error: dbErr }] = await Promise.all([
            fetch(`${META_GRAPH_BASE_URL}/me/adaccounts?${params.toString()}`, { cache: 'no-store' }),
            supabase.from('meta_ads_accounts').select('ad_account_id'),
        ])

        const apiData = await apiRes.json() as Record<string, unknown>

        console.log(`[listMetaAdAccounts] API Meta — status: ${apiRes.status}`)

        if (!apiRes.ok) {
            const errObj = apiData.error as Record<string, unknown> | undefined
            console.error('[listMetaAdAccounts] Erreur API Meta:', apiData.error ?? apiData)
            return { success: false, error: String(errObj?.message ?? `Erreur API Meta (status ${apiRes.status})`) }
        }

        if (dbErr) {
            console.error('[listMetaAdAccounts] Erreur Supabase:', dbErr.message)
            return { success: false, error: `Erreur lecture base de données : ${dbErr.message}` }
        }

        const rawAccounts = (apiData.data ?? []) as Record<string, unknown>[]
        const existingSet = new Set((existingRows ?? []).map((r) => r.ad_account_id))

        const accounts: MetaAdAccount[] = rawAccounts.map((a) => {
            const business = a.business as Record<string, string> | undefined
            return {
                id:            String(a.id ?? ''),
                account_id:    String(a.account_id ?? ''),
                name:          String(a.name ?? ''),
                business_id:   business?.id,
                business_name: business?.name,
                is_existing:   existingSet.has(String(a.id ?? '')),
            }
        })

        console.log(`[listMetaAdAccounts] ${accounts.length} compte(s) retourné(s)`)
        return { success: true, accounts }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        console.error('[listMetaAdAccounts] ERREUR:', message)
        return { success: false, error: message }
    }
}
