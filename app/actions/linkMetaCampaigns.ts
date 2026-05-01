'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

interface SelectedMetaCampaign {
    campaign_id: string
    nom:         string
    objective:   string
}

export interface LinkMetaCampaignsResult {
    success:  boolean
    count?:   number
    error?:   string
}

function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        throw new Error('[linkMetaCampaigns] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
    }
    return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

export async function linkMetaCampaigns(
    programmeId:         string,
    adAccountSupabaseId: string,   // uuid de meta_ads_accounts
    selectedCampaigns:   SelectedMetaCampaign[]
): Promise<LinkMetaCampaignsResult> {
    console.log(
        `[linkMetaCampaigns] programmeId: ${programmeId}, accountId: ${adAccountSupabaseId}, ` +
        `${selectedCampaigns.length} campagne(s) sélectionnée(s)`
    )

    try {
        const supabase = createAdminClient()

        // 1. Supprimer toutes les liaisons Meta existantes pour ce programme (clean slate)
        const { error: deleteErr } = await supabase
            .from('meta_ads_campaigns')
            .delete()
            .eq('programme_id', programmeId)

        if (deleteErr) {
            console.error('[linkMetaCampaigns] Erreur suppression:', deleteErr.message)
            return { success: false, error: `Erreur suppression des liaisons existantes : ${deleteErr.message}` }
        }

        if (selectedCampaigns.length === 0) {
            console.log('[linkMetaCampaigns] Aucune campagne sélectionnée — liaisons effacées')
            return { success: true, count: 0 }
        }

        // 2. Insérer les nouvelles liaisons
        const rows = selectedCampaigns.map((c) => ({
            campaign_id:  c.campaign_id,
            account_id:   adAccountSupabaseId,
            programme_id: programmeId,
            nom:          c.nom,
            objective:    c.objective || null,
            is_active:    true,
        }))

        const { error: insertErr } = await supabase
            .from('meta_ads_campaigns')
            .insert(rows)

        if (insertErr) {
            console.error('[linkMetaCampaigns] Erreur insertion:', insertErr.message)
            return { success: false, error: `Erreur liaison des campagnes : ${insertErr.message}` }
        }

        console.log(`[linkMetaCampaigns] ${rows.length} liaison(s) enregistrée(s)`)
        return { success: true, count: rows.length }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        console.error('[linkMetaCampaigns] ERREUR:', message)
        return { success: false, error: message }
    }
}
