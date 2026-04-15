'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function connectProgramAccounts(
  programId: string,
  googleAdsCustomerId: string,
  metaAdsAccountId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('real_estate_programs')
    .update({
      google_ads_customer_id: googleAdsCustomerId.trim() || null,
      meta_ads_account_id:    metaAdsAccountId.trim()    || null,
    })
    .eq('id', programId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/agency/programs')
  return { success: true }
}
