import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { META_GRAPH_BASE_URL } from '@/app/actions/config'

export async function GET(request: Request) {
    try {
        const requestUrl = new URL(request.url)
        const code  = requestUrl.searchParams.get('code')
        const error = requestUrl.searchParams.get('error')

        if (error) {
            return NextResponse.json(
                { error: `Meta a renvoyé une erreur : ${error}` },
                { status: 400 }
            )
        }

        if (!code) {
            return NextResponse.json({ error: "Aucun code fourni par Meta." }, { status: 400 })
        }

        const supabase = await createClient()

        const { data: settings } = await supabase
            .from('integration_settings')
            .select('client_id, client_secret, redirect_uri')
            .eq('service_name', 'meta_ads')
            .single()

        if (!settings?.client_id || !settings?.client_secret || !settings?.redirect_uri) {
            return NextResponse.json({ error: "Clés API Meta manquantes en base." }, { status: 500 })
        }

        // 1. Échange du code contre un short-lived token
        const shortParams = new URLSearchParams({
            client_id:     settings.client_id,
            client_secret: settings.client_secret,
            redirect_uri:  settings.redirect_uri,
            code,
        })

        const shortRes  = await fetch(
            `${META_GRAPH_BASE_URL}/oauth/access_token?${shortParams.toString()}`,
            { cache: 'no-store' }
        )
        const shortData = await shortRes.json() as Record<string, unknown>

        if (!shortRes.ok || !shortData.access_token) {
            console.error('[callback/meta_ads] Erreur short-lived token:', shortData)
            return NextResponse.json(
                { error: "Échange du code Meta échoué", details: shortData },
                { status: 400 }
            )
        }

        // 2. Échange du short-lived contre un long-lived token (valide ~60 jours)
        const longParams = new URLSearchParams({
            grant_type:        'fb_exchange_token',
            client_id:         settings.client_id,
            client_secret:     settings.client_secret,
            fb_exchange_token: String(shortData.access_token),
        })

        const longRes  = await fetch(
            `${META_GRAPH_BASE_URL}/oauth/access_token?${longParams.toString()}`,
            { cache: 'no-store' }
        )
        const longData = await longRes.json() as Record<string, unknown>

        if (!longRes.ok || !longData.access_token) {
            console.error('[callback/meta_ads] Erreur long-lived token:', longData)
            return NextResponse.json(
                { error: "Échange long-lived token Meta échoué", details: longData },
                { status: 400 }
            )
        }

        // 3. Sauvegarde du long-lived token
        await supabase
            .from('integration_settings')
            .update({
                access_token:     String(longData.access_token),
                token_expires_at: longData.expires_in
                    ? new Date(Date.now() + Number(longData.expires_in) * 1000).toISOString()
                    : null,
                is_connected:     true,
                last_sync:        new Date().toISOString(),
            })
            .eq('service_name', 'meta_ads')

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
        return NextResponse.redirect(`${baseUrl}/agency/settings?success=meta_connected`)

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        console.error('[callback/meta_ads] CRASH:', message)
        return NextResponse.json({ error: "Erreur serveur", message }, { status: 500 })
    }
}
