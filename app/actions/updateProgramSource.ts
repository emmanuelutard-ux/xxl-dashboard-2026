'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function updateProgramSource(programId: string, newSource: 'platform' | 'ga4') {
    const supabase = createClient()

    const { error } = await supabase
        .from('real_estate_programs')
        .update({ conversion_source: newSource })
        .eq('id', programId)

    if (error) {
        console.error('Error updating source:', error)
        throw new Error('Failed to update source')
    }

    revalidatePath('/agency')
}
