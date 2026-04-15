'use server'

import { createClient } from '@/lib/supabase'

export async function saveChecklistState(
  programId: string,
  checkedIds: number[]
): Promise<void> {
  const supabase = createClient()

  const { data } = await supabase
    .from('real_estate_programs')
    .select('brief_data')
    .eq('id', programId)
    .single()

  const existing = (data?.brief_data as Record<string, unknown>) ?? {}
  const updated  = { ...existing, checklist_completed: checkedIds }

  await supabase
    .from('real_estate_programs')
    .update({ brief_data: updated })
    .eq('id', programId)
}
