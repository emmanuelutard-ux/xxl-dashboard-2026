'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export interface LinkMetaAccountResult {
    success:     boolean
    account_id?: string   // uuid Supabase
    error?:      string
}

function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        throw new Error('[linkMetaAccountToProgramme] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
    }
    return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

export async function linkMetaAccountToProgramme(
    programmeId:  string,
    adAccountId:  string,   // "act_1234567890"
    name:         string,
    businessId?:  string
): Promise<LinkMetaAccountResult> {
    console.log(`[linkMetaAccountToProgramme] adAccountId: ${adAccountId}, programmeId: ${programmeId}`)

    try {
        const supabase = createAdminClient()

        // UPSERT : 1 compte Meta peut servir N programmes — pas de blocage contrairement à Google
        const { data: upserted, error: upsertErr } = await supabase
            .from('meta_ads_accounts')
            .upsert(
                {
                    ad_account_id: adAccountId,
                    name,
                    business_id:  businessId ?? null,
                    is_active:    true,
                },
                { onConflict: 'ad_account_id' }
            )
            .select('id')
            .single()

        if (upsertErr) {
            console.error('[linkMetaAccountToProgramme] Erreur UPSERT:', upsertErr.message)
            return { success: false, error: `Erreur enregistrement du compte : ${upsertErr.message}` }
        }

        console.log(`[linkMetaAccountToProgramme] UPSERT OK — account_id: ${upserted.id}`)
        return { success: true, account_id: upserted.id }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        console.error('[linkMetaAccountToProgramme] ERREUR:', message)
        return { success: false, error: message }
    }
}
