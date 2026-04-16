import { createClient } from '@supabase/supabase-js'

export async function getGoogleAccessToken() {
    // Client admin — bypasse le RLS pour lire integration_settings
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('[googleAuth] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
    }

    const supabase = createClient(url, key, {
        auth: { persistSession: false },
    })

    // 1. Récupérer les identifiants
    const { data: settings } = await supabase
        .from('integration_settings')
        .select('client_id, client_secret, refresh_token, developer_token')
        .eq('service_name', 'google_ads')
        .single()

    if (!settings?.refresh_token) {
        throw new Error("Pas de Refresh Token disponible. Reconnectez Google Ads.")
    }

    // SECURITÉ : Nettoyage des espaces
    const cleanClientId     = settings.client_id?.trim()
    const cleanClientSecret = settings.client_secret?.trim()
    const cleanRefreshToken = settings.refresh_token?.trim()

    // 2. Préparer les paramètres (Avec .toString() pour éviter le fetch failed)
    const params = new URLSearchParams({
        client_id:     cleanClientId,
        client_secret: cleanClientSecret,
        refresh_token: cleanRefreshToken,
        grant_type:    'refresh_token',
    })

    // 3. Appel à Google
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        cache: 'no-store'
    })

    const data = await response.json()

    if (!response.ok) {
        console.error("Erreur Refresh Google:", data)
        throw new Error(`Erreur refresh token: ${data.error_description || JSON.stringify(data)}`)
    }

    const developerToken = settings.developer_token ?? null
    console.log('[googleAuth] developerToken récupéré:', developerToken ? `"${developerToken.slice(0, 6)}…"` : 'NULL — colonne vide en base')

    return {
        accessToken:    data.access_token,
        developerToken,
    }
}
