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
    console.log(`[syncAllPlatforms] Démarrage — programId: ${programId ?? '(aucun)'}`)

    const [google, meta] = await Promise.all([
        syncGoogleAds(programId, dateRange),
        syncMetaAds(programId, dateRange),
    ])

    const success = google.success || meta.success

    const parts: string[] = []
    parts.push(google.success ? `Google: ${google.inserted} jours` : 'Google: échec')
    parts.push(meta.success   ? `Meta: ${meta.inserted} jours`     : 'Meta: échec')

    return { success, message: parts.join(' · '), google, meta }
}
