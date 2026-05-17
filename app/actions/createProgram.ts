'use server'
import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function createProgram(formData: FormData) {
    const supabase = createClient() // Removed await as per lib/supabase implementation

    const name = formData.get('name')
    const total_budget = formData.get('total_budget')
    const start_date = formData.get('start_date')
    const end_date = formData.get('end_date')

    console.log("Tentative de création :", { name, total_budget })

    const { data, error } = await supabase
        .from('real_estate_programs')
        .insert({
            name,
            total_budget: Number(total_budget),
            start_date: start_date || null,
            end_date: end_date || null,
            status: 'active',
            conversion_source: 'platform'
        })
        .select()

    if (error) {
        console.error('ERREUR SUPABASE:', error) // Sera visible dans le terminal
        return { success: false, errorMessage: error.message, details: error.details }
    }

    revalidatePath('/agency')
    revalidatePath('/agency/media-room')
    return { success: true }
}
