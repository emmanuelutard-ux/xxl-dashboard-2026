'use server'
import { createClient } from '@/utils/supabase/server'

export async function getIntegrationStatus() {
    const supabase = await createClient()

    const { data } = await supabase
        .from('integration_settings')
        .select('service_name, is_connected')

    // On transforme le tableau en objet simple : { google_ads: true, meta_ads: false }
    const status: Record<string, boolean> = {}

    data?.forEach((item) => {
        status[item.service_name] = item.is_connected
    })

    return status
}
