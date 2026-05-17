'use server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function importPrograms(formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('file') as File

    if (!file) return { success: false, error: "Aucun fichier fourni" }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim() !== '')

    // On ignore la première ligne (en-têtes)
    const dataRows = lines.slice(1)

    let successCount = 0
    let errors: string[] = []

    for (const row of dataRows) {
        // Format attendu CSV : Nom,Budget,DateDebut,DateFin,CampagneID_Google
        // Ex: "Programme Bagneux,15000,2024-01-01,2024-06-01,123456789"
        const columns = row.split(',')

        if (columns.length < 2) continue // Ligne invalide

        const name = columns[0]?.trim()
        const budget = parseFloat(columns[1]?.trim() || '0')
        const startDate = columns[2]?.trim() || null
        const endDate = columns[3]?.trim() || null
        const googleId = columns[4]?.trim() || null

        if (!name) continue

        const { error } = await supabase.from('real_estate_programs').insert({
            name,
            total_budget: budget,
            start_date: startDate,
            end_date: endDate,
            google_ads_campaign_id: googleId,
            status: 'active',
            conversion_source: 'platform' // Valeur par défaut pour l'instant
        })

        if (error) {
            errors.push(`Erreur sur ${name}: ${error.message}`)
        } else {
            successCount++
        }
    }

    revalidatePath('/agency')
    revalidatePath('/agency/media-room')

    return {
        success: true,
        message: `${successCount} programmes importés.`,
        errors: errors.length > 0 ? errors : undefined
    }
}
