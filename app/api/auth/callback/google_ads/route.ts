import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const requestUrl = new URL(request.url)
        const code = requestUrl.searchParams.get('code')
        const error = requestUrl.searchParams.get('error')

        if (error) {
            return NextResponse.json({ error: `Google a renvoyé une erreur : ${error}` }, { status: 400 })
        }

        if (!code) {
            return NextResponse.json({ error: "Aucun code fourni par Google." }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Récupération des clés
        const { data: settings } = await supabase
            .from('integration_settings')
            .select('client_id, client_secret')
            .eq('service_name', 'google_ads')
            .single()

        if (!settings?.client_id || !settings?.client_secret) {
            return NextResponse.json({ error: "Clés API manquantes en base." }, { status: 500 })
        }

        const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/callback/google_ads`

        // 2. Échange du code (CORRECTIF ICI : .toString() explicite)
        const params = new URLSearchParams()
        params.append('code', code)
        params.append('client_id', settings.client_id)
        params.append('client_secret', settings.client_secret)
        params.append('redirect_uri', redirectUri)
        params.append('grant_type', 'authorization_code')

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString(), // <--- C'est ça qui résout le "fetch failed"
            cache: 'no-store'
        })

        const tokens = await tokenResponse.json()

        if (!tokenResponse.ok) {
            return NextResponse.json({
                error: "Google a refusé l'échange",
                details: tokens
            }, { status: 400 })
        }

        // 3. Sauvegarde
        const updateData: any = { is_connected: true, last_sync: new Date().toISOString() }
        if (tokens.refresh_token) {
            updateData.refresh_token = tokens.refresh_token
        }

        await supabase
            .from('integration_settings')
            .update(updateData)
            .eq('service_name', 'google_ads')

        // 4. Succès
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/expert/cockpit?success=google_connected`)

    } catch (err: any) {
        console.error("CRASH:", err)
        return NextResponse.json({ error: "Erreur serveur", message: err.message }, { status: 500 })
    }
}
