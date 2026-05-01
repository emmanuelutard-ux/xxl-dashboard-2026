import { createClient } from '@supabase/supabase-js'

export async function getMetaAccessToken(): Promise<string> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('[metaAuth] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
    }

    const supabase = createClient(url, key, { auth: { persistSession: false } })

    const { data: settings } = await supabase
        .from('integration_settings')
        .select('access_token')
        .eq('service_name', 'meta_ads')
        .single()

    if (!settings?.access_token) {
        throw new Error("Pas d'access token Meta. Reconnectez Meta Ads dans les paramètres.")
    }

    return settings.access_token as string
}
