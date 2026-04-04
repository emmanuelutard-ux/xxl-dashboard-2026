'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function validateMediaPlan(
  programId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('real_estate_programs')
    .update({ status: 'validated' })
    .eq('id', programId)

  if (error) return { success: false, error: error.message }

  revalidatePath(`/agency/programs/${programId}`)
  revalidatePath('/agency/media-room')
  return { success: true }
}
