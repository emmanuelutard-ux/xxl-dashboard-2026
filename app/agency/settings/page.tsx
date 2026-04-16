import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { redirect } from 'next/navigation'
import SettingsClient, { type IntegrationStatus, type EnvStatus } from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  // ── Contrôle d'accès ───────────────────────────────────────────────────────
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabaseAuth
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'client') redirect('/agency/media-room')

  // ── Lecture des intégrations (service role pour bypasser RLS) ──────────────
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: integrationRows } = await supabaseAdmin
    .from('integration_settings')
    .select('service_name, is_connected, last_sync')
    .in('service_name', ['google_ads', 'meta_ads'])

  const googleRow = integrationRows?.find(r => r.service_name === 'google_ads') ?? null
  const metaRow   = integrationRows?.find(r => r.service_name === 'meta_ads')   ?? null

  const integrations: IntegrationStatus = {
    google: googleRow ? { is_connected: googleRow.is_connected, last_sync: googleRow.last_sync } : null,
    meta:   metaRow   ? { is_connected: metaRow.is_connected,   last_sync: metaRow.last_sync   } : null,
  }

  // ── Vérification des variables d'environnement (côté serveur uniquement) ───
  const env: EnvStatus = {
    ANTHROPIC_API_KEY:         !!process.env.ANTHROPIC_API_KEY,
    NEXT_PUBLIC_SUPABASE_URL:  !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  return <SettingsClient integrations={integrations} env={env} />
}
