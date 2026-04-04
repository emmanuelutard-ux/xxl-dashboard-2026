'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export type ProgramStatus = 'brief' | 'validated' | 'active' | 'live' | 'paused' | 'archived'

const VALID_STATUSES: ProgramStatus[] = ['brief', 'validated', 'active', 'live', 'paused', 'archived']

export async function updateProgramStatus(
  programId: string,
  status: ProgramStatus
): Promise<{ success: boolean; error?: string }> {
  if (!VALID_STATUSES.includes(status)) {
    return { success: false, error: `Statut invalide : ${status}` }
  }

  const supabase = createClient()

  const { error } = await supabase
    .from('real_estate_programs')
    .update({ status })
    .eq('id', programId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/agency/programs')
  revalidatePath(`/agency/programs/${programId}`)
  revalidatePath('/agency/media-room')

  return { success: true }
}
