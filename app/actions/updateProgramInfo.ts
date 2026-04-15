'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export interface ProgramInfoFields {
  start_date:       string | null
  end_date:         string | null
  budget_google:    number | null
  budget_meta:      number | null
  landing_page_url: string | null
}

export async function updateProgramInfo(
  programId: string,
  fields: ProgramInfoFields
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('real_estate_programs')
    .update({
      start_date:       fields.start_date       || null,
      end_date:         fields.end_date         || null,
      budget_google:    fields.budget_google    ?? null,
      budget_meta:      fields.budget_meta      ?? null,
      landing_page_url: fields.landing_page_url || null,
    })
    .eq('id', programId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/agency/programs/${programId}`)
  return { success: true }
}
