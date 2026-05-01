'use server'

import { getMetaAccessToken } from '@/utils/metaAuth'
import { META_GRAPH_BASE_URL } from './config'

export interface MetaTestResult {
    ok:    boolean
    id?:   string
    name?: string
    error?: string
}

export async function testMetaConnection(): Promise<MetaTestResult> {
    try {
        const accessToken = await getMetaAccessToken()

        const params = new URLSearchParams({ fields: 'id,name', access_token: accessToken })
        const res    = await fetch(`${META_GRAPH_BASE_URL}/me?${params.toString()}`, { cache: 'no-store' })
        const data   = await res.json() as Record<string, unknown>

        if (!res.ok || data.error) {
            const errObj = data.error as Record<string, unknown> | undefined
            console.error('[testMetaConnection] Erreur API Meta:', data.error ?? data)
            return {
                ok:    false,
                error: String(errObj?.message ?? `Erreur API Meta (status ${res.status})`),
            }
        }

        console.log(`[testMetaConnection] Connecté — id: ${data.id}, name: ${data.name}`)
        return { ok: true, id: String(data.id), name: String(data.name) }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        console.error('[testMetaConnection] ERREUR:', message)
        return { ok: false, error: message }
    }
}
