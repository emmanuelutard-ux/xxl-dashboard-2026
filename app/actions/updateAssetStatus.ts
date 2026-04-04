'use server'
import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function updateAssetStatus(assetId: string, newStatus: 'validated' | 'rejected' | 'pending') {
    const supabase = createClient()

    // Mise à jour du statut dans la table creative_assets
    const { error } = await supabase
        .from('creative_assets')
        .update({ status: newStatus })
        .eq('id', assetId)

    if (error) {
        console.error('Erreur lors de la mise à jour du statut:', error)
        return { success: false, error: error.message }
    }

    // On rafraîchit la page agence par sécurité
    revalidatePath('/agency/media-room')
    revalidatePath('/expert/cockpit')
    return { success: true }
}
