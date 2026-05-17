'use server'
import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function uploadAsset(formData: FormData) {
    const supabase = createClient()

    const file = formData.get('file') as File
    const programId = formData.get('programId') as string
    const type = formData.get('type') as string // 'image' ou 'video'

    if (!file || !programId) return { success: false, error: 'Fichier manquant' }

    // 1. Upload dans Supabase Storage
    // Sanitize filename to avoid weird character issues
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${Date.now()}-${sanitizedFileName}`

    const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('campaign-assets')
        .upload(fileName, file)

    if (uploadError) {
        console.error('Upload Error:', uploadError)
        return { success: false, error: uploadError.message }
    }

    // 2. Récupérer l'URL Publique
    const { data: { publicUrl } } = supabase
        .storage
        .from('campaign-assets')
        .getPublicUrl(fileName)

    // 3. Sauvegarder dans la BDD
    const { error: dbError } = await supabase
        .from('creative_assets')
        .insert({
            program_id: programId,
            name: file.name,
            type: type,
            url: publicUrl,
            status: 'pending' // Par défaut
        })

    if (dbError) {
        console.error('DB Insert Error:', dbError)
        return { success: false, error: dbError.message }
    }

    revalidatePath('/agency/media-room')
    revalidatePath('/agency') // Adding this as assets are viewed here too
    return { success: true }
}
