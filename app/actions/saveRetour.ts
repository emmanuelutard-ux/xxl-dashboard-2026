'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export interface Retour {
  section: string
  commentaire: string
  date: string
  auteur: string
}

export async function saveRetour(
  programId: string,
  data: { section: string; commentaire: string; auteur: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { data: program, error: fetchError } = await supabase
    .from('real_estate_programs')
    .select('brief_data')
    .eq('id', programId)
    .single()

  if (fetchError || !program) {
    return { success: false, error: fetchError?.message ?? 'Programme introuvable.' }
  }

  const briefData = (program.brief_data as Record<string, unknown>) ?? {}
  const existing = (briefData.retours as Retour[]) ?? []

  const newRetour: Retour = {
    section: data.section,
    commentaire: data.commentaire,
    auteur: data.auteur,
    date: new Date().toISOString(),
  }

  const { error: updateError } = await supabase
    .from('real_estate_programs')
    .update({ brief_data: { ...briefData, retours: [...existing, newRetour] } })
    .eq('id', programId)

  if (updateError) return { success: false, error: updateError.message }

  revalidatePath(`/agency/programs/${programId}`)
  return { success: true }
}
