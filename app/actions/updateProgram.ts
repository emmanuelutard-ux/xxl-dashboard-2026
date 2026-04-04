'use server'
import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function updateProgram(programId: string, formData: FormData) {
    const supabase = createClient()

    // Récupération des champs existants
    const total_budget = formData.get('total_budget')
    const start_date = formData.get('start_date')
    const end_date = formData.get('end_date')
    const status = formData.get('status')

    // Récupération des nouveaux champs (Briefing)
    const landing_page_url = formData.get('landing_page_url')
    const campaign_brief = formData.get('campaign_brief')

    const { error } = await supabase
        .from('real_estate_programs')
        .update({
            total_budget: Number(total_budget),
            start_date: start_date === '' ? null : start_date,
            end_date: end_date === '' ? null : end_date,
            status: status ? String(status) : undefined,
            landing_page_url: landing_page_url,
            campaign_brief: campaign_brief
        })
        .eq('id', programId)

    if (error) {
        console.error('Error updating program:', error)
        return { success: false, error: error.message }
    }

    // Rafraîchissement global
    revalidatePath('/expert/cockpit')
    revalidatePath('/client/dashboard')
    revalidatePath('/agency/media-room')
    revalidatePath('/', 'layout')

    return { success: true }
}
