import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    // 1. Récupérer le Client ID stocké
    const { data: settings } = await supabase
        .from('integration_settings')
        .select('client_id')
        .eq('service_name', 'google_ads')
        .single()

    if (!settings?.client_id) {
        return NextResponse.json({ error: "Client ID introuvable. Configurez les clés d'abord." }, { status: 400 })
    }

    // 2. Construire l'URL OAuth Google
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/callback/google_ads`

    // MODIFICATION ICI : On utilise le scope "adwords" qui est déjà actif dans ta console
    // Au lieu de "https://www.googleapis.com/auth/google-ads"
    const scope = 'https://www.googleapis.com/auth/adwords'

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${settings.client_id}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`

    // 3. Rediriger l'utilisateur
    return NextResponse.redirect(googleAuthUrl)
}
