'use server'

import { syncGoogleAds } from './syncGoogleAds'
import { syncMetaAds } from './syncMetaAds'
import type { DateRange, SyncResult } from './syncGoogleAds'

export type { DateRange }

export interface SyncAllResult {
    success: boolean
    message: string
    google:  SyncResult
    meta:    SyncResult
}

export async function syncAllPlatforms(
    programId?: string,
    dateRange?: DateRange
): Promise<SyncAllResult> {
    console.log(`[sync-all] start programme=${programId ?? '(aucun)'}`)
    console.log(`[sync-all] launching google + meta in parallel`)

    const [google, meta] = await Promise.all([
        syncGoogleAds(programId, dateRange),
        syncMetaAds(programId, dateRange),
    ])

    console.log(`[sync-all] google done success=${google.success} meta done success=${meta.success}`)

    const success = google.success || meta.success

    const parts: string[] = []
    parts.push(google.success ? `Google: ${google.inserted} jours` : 'Google: échec')
    parts.push(meta.success   ? `Meta: ${meta.inserted} jours`     : 'Meta: échec')

    const result: SyncAllResult = { success, message: parts.join(' · '), google, meta }

    console.log(`[sync-all] returning result: success=${success} message="${result.message}"`)

    return result
}
