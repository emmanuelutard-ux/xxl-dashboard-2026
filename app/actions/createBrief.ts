'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export type TrackingStatus = 'disponible' | 'a_creer' | 'non_dispo'

export interface BriefFormData {
  name: string
  location: string
  promoteur: string
  lot_count: number | null
  has_brs: boolean
  budget_google: number
  budget_meta: number
  campaign_duration_days: number | null
  landing_page_url: string
  lp_not_ready: boolean
  lp_provider: 'agency' | 'promoteur' | 'a_creer'
  crm_provider: 'unlatch' | 'adlead' | 'google_sheets' | 'aucun' | 'autre'
  crm_provider_autre: string
  pixel_meta_status: TrackingStatus
  google_ads_tracking_status: TrackingStatus
  ga4_status: TrackingStatus
  facebook_access_status: TrackingStatus
  gtm_status: TrackingStatus
  launch_date: string
  notes: string
}

export async function createBrief(
  data: BriefFormData
): Promise<{ success: boolean; error?: string; programId?: string }> {
  const supabase = createClient()

  // Données stockées dans brief_data (champs sans colonne dédiée)
  const brief_data = {
    promoteur: data.promoteur,
    campaign_duration_days: data.campaign_duration_days,
    lp_provider: data.lp_provider,
    lp_not_ready: data.lp_not_ready,
    crm_autre: data.crm_provider === 'autre' ? data.crm_provider_autre.trim() : null,
    pixel_meta_status: data.pixel_meta_status,
    google_ads_tracking_status: data.google_ads_tracking_status,
    ga4_status: data.ga4_status,
    facebook_access_status: data.facebook_access_status,
    gtm_status: data.gtm_status,
    notes: data.notes,
  }

  const { data: program, error } = await supabase
    .from('real_estate_programs')
    .insert({
      name: data.name.trim(),
      location: data.location.trim() || null,
      lot_count: data.lot_count,
      has_brs: data.has_brs,
      budget_google: data.budget_google,
      budget_meta: data.budget_meta,
      landing_page_url: data.landing_page_url.trim() || null,
      crm_provider: data.crm_provider,
      start_date: data.launch_date || null,
      status: 'brief',
      conversion_source: 'platform',
      brief_data,
      brief_completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    console.error('Erreur création brief:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/agency/media-room')
  revalidatePath('/agency')

  return { success: true, programId: program.id }
}
