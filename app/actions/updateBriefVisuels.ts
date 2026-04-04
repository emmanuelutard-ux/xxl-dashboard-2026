'use server'

import { createClient } from '@/lib/supabase'

export async function updateBriefVisuels(
  programId: string,
  visuelsUrls: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  // Lecture du brief_data existant pour merge
  const { data: program } = await supabase
    .from('real_estate_programs')
    .select('brief_data')
    .eq('id', programId)
    .single()

  const current = (program?.brief_data as Record<string, unknown>) ?? {}

  const { error } = await supabase
    .from('real_estate_programs')
    .update({ brief_data: { ...current, visuels_urls: visuelsUrls } })
    .eq('id', programId)

  if (error) {
    console.error('Erreur update visuels:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}
