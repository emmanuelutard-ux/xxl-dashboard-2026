'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export interface BriefV2Data {
  name: string
  location: string
  promoteur: string
  lot_count: number | null
  has_brs: boolean
  notes: string
  target_profiles: string[]
  usp: string
  google_active: boolean
  budget_google: number
  google_start: string | null
  google_end: string | null
  meta_active: boolean
  budget_meta: number
  meta_start: string | null
  meta_end: string | null
  landing_page_url: string
  lp_not_ready: boolean
  crm_provider: 'unlatch' | 'adlead' | 'google_sheets' | 'aucun' | 'autre'
  ai_plan?: Record<string, unknown> | null
}

export async function createProgramFromBrief(data: BriefV2Data): Promise<{
  success: boolean
  programId?: string
  error?: string
}> {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const start_date = data.google_start || data.meta_start || null
  const end_date   = data.google_end   || data.meta_end   || null

  const brief_data = {
    promoteur:                    data.promoteur,
    target_profiles:              data.target_profiles,
    usp:                          data.usp,
    google_active:                data.google_active,
    google_start:                 data.google_start,
    google_end:                   data.google_end,
    meta_active:                  data.meta_active,
    meta_start:                   data.meta_start,
    meta_end:                     data.meta_end,
    lp_not_ready:                 data.lp_not_ready,
    notes:                        data.notes,
    ai_plan:                      data.ai_plan ?? null,
    // defaults pour compatibilité avec l'ancien brief_data
    lp_provider:                  'promoteur',
    pixel_meta_status:            'a_creer',
    google_ads_tracking_status:   'a_creer',
    ga4_status:                   'a_creer',
    facebook_access_status:       'a_creer',
    gtm_status:                   'a_creer',
  }

  const { data: program, error } = await supabase
    .from('real_estate_programs')
    .insert({
      name:              data.name.trim(),
      location:          data.location.trim() || null,
      lot_count:         data.lot_count,
      has_brs:           data.has_brs,
      budget_google:     data.budget_google,
      budget_meta:       data.budget_meta,
      landing_page_url:  data.lp_not_ready ? null : data.landing_page_url.trim() || null,
      crm_provider:      data.crm_provider,
      start_date,
      end_date,
      status:            'brief',
      conversion_source: 'platform',
      brief_data,
      brief_completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('Erreur création programme:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/agency/programs')
  revalidatePath('/agency/media-room')

  return { success: true, programId: program.id }
}
