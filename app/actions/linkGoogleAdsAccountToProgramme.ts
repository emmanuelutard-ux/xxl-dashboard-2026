'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const MCC_ID = '8667313568'

export interface LinkAccountResult {
  success: boolean
  account_id?: string
  error?: string
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('[linkGoogleAdsAccountToProgramme] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  }
  return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

export async function linkGoogleAdsAccountToProgramme(
  customer_id: string,
  nom: string,
  programme_id: string
): Promise<LinkAccountResult> {
  console.log(`[linkGoogleAdsAccountToProgramme] customer_id: ${customer_id}, programme_id: ${programme_id}`)

  try {
    const supabase = createAdminClient()

    // Vérifier si le compte existe déjà dans google_ads_accounts
    const { data: existing, error: readErr } = await supabase
      .from('google_ads_accounts')
      .select('id, programme_id')
      .eq('customer_id', customer_id)
      .maybeSingle()

    if (readErr) {
      console.error('[linkGoogleAdsAccountToProgramme] Erreur lecture:', readErr.message)
      return { success: false, error: `Erreur lecture : ${readErr.message}` }
    }

    if (existing) {
      // Cas 1 : lié à un programme différent → refus strict
      if (existing.programme_id && existing.programme_id !== programme_id) {
        console.warn(`[linkGoogleAdsAccountToProgramme] Compte déjà lié à ${existing.programme_id} — refus`)
        return { success: false, error: 'Ce compte est déjà lié à un autre programme.' }
      }

      // Cas 2 : déjà lié au même programme → no-op
      if (existing.programme_id === programme_id) {
        console.log('[linkGoogleAdsAccountToProgramme] Déjà lié au même programme — no-op')
        return { success: true, account_id: existing.id }
      }

      // Cas 3 : programme_id NULL → UPDATE
      const { error: updateErr } = await supabase
        .from('google_ads_accounts')
        .update({ programme_id })
        .eq('id', existing.id)

      if (updateErr) {
        console.error('[linkGoogleAdsAccountToProgramme] Erreur UPDATE:', updateErr.message)
        return { success: false, error: `Erreur mise à jour : ${updateErr.message}` }
      }

      console.log(`[linkGoogleAdsAccountToProgramme] UPDATE OK — account_id: ${existing.id}`)
      return { success: true, account_id: existing.id }
    }

    // Cas 4 : ligne inexistante → INSERT
    const { data: inserted, error: insertErr } = await supabase
      .from('google_ads_accounts')
      .insert({
        customer_id,
        nom,
        mcc_id:       MCC_ID,
        programme_id,
        is_active:    true,
      })
      .select('id')
      .single()

    if (insertErr) {
      console.error('[linkGoogleAdsAccountToProgramme] Erreur INSERT:', insertErr.message)
      return { success: false, error: `Erreur insertion : ${insertErr.message}` }
    }

    console.log(`[linkGoogleAdsAccountToProgramme] INSERT OK — account_id: ${inserted.id}`)
    return { success: true, account_id: inserted.id }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[linkGoogleAdsAccountToProgramme] ERREUR:', message)
    return { success: false, error: message }
  }
}
