import { createClient } from '@/utils/supabase/server'

export async function getGoogleAccessToken() {
    const supabase = await createClient()

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
    const cleanClientId = settings.client_id?.trim()
    const cleanClientSecret = settings.client_secret?.trim()
    const cleanRefreshToken = settings.refresh_token?.trim()

    // 2. Préparer les paramètres (Avec .toString() pour éviter le fetch failed)
    const params = new URLSearchParams({
        client_id: cleanClientId,
        client_secret: cleanClientSecret,
        refresh_token: cleanRefreshToken,
        grant_type: 'refresh_token',
    })

    // 3. Appel à Google
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(), // <--- LE FIX EST ICI
        cache: 'no-store'
    })

    const data = await response.json()

    if (!response.ok) {
        console.error("Erreur Refresh Google:", data)
        throw new Error(`Erreur refresh token: ${data.error_description || JSON.stringify(data)}`)
    }

    return {
        accessToken: data.access_token,
        developerToken: settings.developer_token
    }
}
