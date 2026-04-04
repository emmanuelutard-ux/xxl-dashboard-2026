'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function addAsset(programId: string, type: 'image' | 'video', url: string, name: string) {
    const supabase = createClient()

    if (!programId || !url) {
        return { success: false, error: 'Program ID and URL are required' }
    }

    const { error } = await supabase
        .from('creative_assets')
        .insert({
            program_id: programId,
            type,
            url,
            name: name || 'Asset Sans Nom',
            status: 'pending' // Default status
        })

    if (error) {
        console.error('Error adding asset:', error)
        return { success: false, error: 'Failed to add asset' }
    }

    revalidatePath('/expert/cockpit')
    revalidatePath('/agency/media-room')
    return { success: true }
}
