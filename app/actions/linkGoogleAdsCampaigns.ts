'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

interface SelectedCampaign {
  campaign_id: string
  nom: string
  type: string
}

export interface LinkCampaignsResult {
  success: boolean
  count?: number
  error?: string
}

function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('[linkGoogleAdsCampaigns] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  })
}

export async function linkGoogleAdsCampaigns(
  programmeId: string,
  accountId: string,
  selectedCampaigns: SelectedCampaign[]
): Promise<LinkCampaignsResult> {
  console.log(
    `[linkGoogleAdsCampaigns] programmeId: ${programmeId}, accountId: ${accountId}, ` +
    `${selectedCampaigns.length} campagne(s) sélectionnée(s)`
  )

  try {
    const supabase = createAdminClient()

    // 1. Supprimer toutes les liaisons existantes pour ce programme
    const { error: deleteErr } = await supabase
      .from('google_ads_campaigns')
      .delete()
      .eq('programme_id', programmeId)

    if (deleteErr) {
      console.error('[linkGoogleAdsCampaigns] Erreur suppression:', deleteErr.message)
      return { success: false, error: `Erreur suppression des liaisons existantes : ${deleteErr.message}` }
    }

    if (selectedCampaigns.length === 0) {
      console.log('[linkGoogleAdsCampaigns] Aucune campagne sélectionnée — liaisons effacées')
      return { success: true, count: 0 }
    }

    // 2. Insérer les nouvelles liaisons
    const rows = selectedCampaigns.map((c) => ({
      campaign_id:  c.campaign_id,
      account_id:   accountId,
      programme_id: programmeId,
      nom:          c.nom,
      type:         c.type || null,
      is_active:    true,
    }))

    const { error: insertErr } = await supabase
      .from('google_ads_campaigns')
      .insert(rows)

    if (insertErr) {
      console.error('[linkGoogleAdsCampaigns] Erreur insertion:', insertErr.message)
      return { success: false, error: `Erreur liaison des campagnes : ${insertErr.message}` }
    }

    console.log(`[linkGoogleAdsCampaigns] ${rows.length} liaison(s) enregistrée(s)`)
    return { success: true, count: rows.length }

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[linkGoogleAdsCampaigns] ERREUR:', message)
    return { success: false, error: message }
  }
}
