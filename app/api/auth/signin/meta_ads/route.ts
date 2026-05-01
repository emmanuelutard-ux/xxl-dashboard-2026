import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { META_API_VERSION } from '@/app/actions/config'

export async function GET() {
    const supabase = await createClient()

    const { data: settings } = await supabase
        .from('integration_settings')
        .select('client_id, redirect_uri')
        .eq('service_name', 'meta_ads')
        .single()

    if (!settings?.client_id || !settings?.redirect_uri) {
        return NextResponse.json(
            { error: "Configuration Meta manquante. Renseignez App ID et redirect_uri dans integration_settings." },
            { status: 400 }
        )
    }

    const state = crypto.randomUUID()

    const params = new URLSearchParams({
        client_id:     settings.client_id,
        redirect_uri:  settings.redirect_uri,
        state,
        scope:         'ads_read,ads_management,business_management,pages_read_engagement',
        response_type: 'code',
    })

    const facebookAuthUrl = `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?${params.toString()}`

    return NextResponse.redirect(facebookAuthUrl)
}
