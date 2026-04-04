'use server'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveIntegrationSettings(formData: FormData) {
    const supabase = await createClient()

    const service = formData.get('service') as string

    // SECURITÉ : On utilise .trim() pour supprimer les espaces invisibles avant/après
    const clientId = (formData.get('client_id') as string || '').trim()
    const clientSecret = (formData.get('client_secret') as string || '').trim()
    const developerToken = (formData.get('developer_token') as string || '').trim()

    const updateData: any = {
        client_id: clientId,
        client_secret: clientSecret,
    }

    if (service === 'google_ads' && developerToken) {
        updateData.developer_token = developerToken
    }

    // Upsert
    const { error } = await supabase
        .from('integration_settings')
        .upsert({
            service_name: service,
            ...updateData
        }, { onConflict: 'service_name' })

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/expert/cockpit')
    return { success: true }
}
