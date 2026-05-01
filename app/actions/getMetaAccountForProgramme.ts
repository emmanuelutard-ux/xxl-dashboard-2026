'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export interface MetaAccountForProgramme {
  id:            string   // uuid Supabase (meta_ads_accounts.id)
  ad_account_id: string   // "act_XXX"
  name:          string
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('[getMetaAccountForProgramme] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  }
  return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

export async function getMetaAccountForProgramme(
  programmeId: string
): Promise<MetaAccountForProgramme | null> {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('meta_ads_campaigns')
      .select('meta_ads_accounts!inner(id, ad_account_id, name)')
      .eq('programme_id', programmeId)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[getMetaAccountForProgramme] Erreur:', error.message)
      return null
    }

    if (!data) return null

    type AccountJoin = { id: string; ad_account_id: string; name: string }
    const acc = (data as unknown as { meta_ads_accounts: AccountJoin }).meta_ads_accounts
    return { id: acc.id, ad_account_id: acc.ad_account_id, name: acc.name }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[getMetaAccountForProgramme] ERREUR:', message)
    return null
  }
}
