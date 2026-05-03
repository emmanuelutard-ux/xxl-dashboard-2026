'use server'

import { getMetaAccessToken } from '@/utils/metaAuth'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { META_GRAPH_BASE_URL } from './config'
import type { DateRange, SyncResult } from './syncGoogleAds'

const MAX_PAGES = 50

function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
        throw new Error('[meta-sync] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant')
    }
    return createSupabaseClient(url, key, { auth: { persistSession: false } })
}

function buildTimeRange(dateRange?: DateRange): { since: string; until: string } {
    if (dateRange?.startDate) {
        const until = dateRange.endDate ?? new Date().toISOString().split('T')[0]
        return { since: dateRange.startDate, until }
    }
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return { since: d.toISOString().split('T')[0], until: new Date().toISOString().split('T')[0] }
}

function parseLeads(actions: unknown): number {
    if (!Array.isArray(actions)) return 0
    return actions
        .filter((a) => {
            const act = a as Record<string, unknown>
            return act.action_type === 'lead' || act.action_type === 'onsite_conversion.lead_grouped'
        })
        .reduce((sum, a) => sum + Number((a as Record<string, unknown>).value ?? 0), 0)
}

interface InsightsRow {
    campaign_id:        string
    date_start:         string
    spend:              string
    inline_link_clicks: string
    impressions:        string
    actions?:           unknown[]
}

async function fetchMetaInsights(
    adAccountId: string,
    campaignIds: string[],
    timeRange: { since: string; until: string },
    accessToken: string
): Promise<InsightsRow[]> {
    const filtering = JSON.stringify([{ field: 'campaign.id', operator: 'IN', value: campaignIds }])

    const params = new URLSearchParams({
        level:          'campaign',
        fields:         'campaign_id,spend,actions,inline_link_clicks,impressions',
        time_increment: '1',
        time_range:     JSON.stringify(timeRange),
        filtering,
        limit:          '500',
        access_token:   accessToken,
    })

    let url: string | null = `${META_GRAPH_BASE_URL}/${adAccountId}/insights?${params.toString()}`
    const allRows: InsightsRow[] = []
    let page = 0

    while (url) {
        if (page >= MAX_PAGES) {
            console.warn(`[meta-sync] ABORT pagination limit reached (${MAX_PAGES} pages) — account ${adAccountId}`)
            break
        }

        page++
        const res  = await fetch(url, { cache: 'no-store' })
        const data = await res.json() as {
            data?:   unknown[]
            paging?: { next?: string }
            error?:  Record<string, unknown>
        }

        if (!res.ok) {
            throw new Error(`Meta Insights API error (${adAccountId}): ${String(data.error?.message ?? res.status)}`)
        }

        const pageRows = data.data ?? []
        const hasNext  = Boolean(data.paging?.next)

        console.log(`[meta-sync] page ${page} received, ${pageRows.length} rows, has_next=${hasNext} — account ${adAccountId}`)

        for (const row of pageRows) {
            allRows.push(row as InsightsRow)
        }

        url = hasNext ? (data.paging?.next ?? null) : null
    }

    console.log(`[meta-sync] all pages done, total ${allRows.length} insights collected — account ${adAccountId}`)

    return allRows
}

export async function syncMetaAds(
    programId?: string,
    dateRange?: DateRange
): Promise<SyncResult> {
    console.log(`[meta-sync] start programme=${programId ?? '(aucun)'} dateRange=${JSON.stringify(dateRange ?? {})}`)

    try {
        const accessToken = await getMetaAccessToken()
        console.log('[meta-sync] token obtained')

        const supabase = createAdminClient()

        type CampaignRow = {
            campaign_id:       string
            programme_id:      string
            meta_ads_accounts: { ad_account_id: string } | null
        }

        let campaignsQuery = supabase
            .from('meta_ads_campaigns')
            .select('campaign_id, programme_id, meta_ads_accounts!inner(ad_account_id)')
            .eq('is_active', true)

        if (programId) {
            campaignsQuery = campaignsQuery.eq('programme_id', programId)
        }

        const { data: rawCampaigns, error: campErr } = await campaignsQuery
        if (campErr) throw new Error(`Erreur lecture meta_ads_campaigns : ${campErr.message}`)

        const campaignRows = (rawCampaigns ?? []) as unknown as CampaignRow[]

        // Grouper par ad_account_id pour compter les comptes distincts
        interface AccountGroup {
            adAccountId: string
            campaigns: Array<{ campaignId: string; programmeId: string }>
        }

        const byAccount = new Map<string, AccountGroup>()
        for (const row of campaignRows) {
            const account = row.meta_ads_accounts
            if (!account) continue
            const group = byAccount.get(account.ad_account_id) ?? {
                adAccountId: account.ad_account_id,
                campaigns:   [],
            }
            group.campaigns.push({ campaignId: row.campaign_id, programmeId: row.programme_id })
            byAccount.set(account.ad_account_id, group)
        }

        console.log(`[meta-sync] campaigns found: ${campaignRows.length} campaigns across ${byAccount.size} accounts`)

        if (campaignRows.length === 0) {
            return {
                success: false,
                message: 'Aucune campagne Meta liée à ce programme. Configurez les liaisons via Gérer les campagnes.',
                inserted: 0,
            }
        }

        const timeRange   = buildTimeRange(dateRange)
        let totalInserted = 0

        for (const { adAccountId, campaigns } of byAccount.values()) {
            const campaignIds      = campaigns.map((c) => c.campaignId)
            const campaignToProgId = new Map(campaigns.map((c) => [c.campaignId, c.programmeId]))

            console.log(`[meta-sync] fetching account ${adAccountId} with ${campaignIds.length} campaigns, time_range=${JSON.stringify(timeRange)}`)

            const rows = await fetchMetaInsights(adAccountId, campaignIds, timeRange, accessToken)

            if (rows.length === 0) {
                console.log(`[meta-sync] no insights for account ${adAccountId}, skipping`)
                continue
            }

            // Agréger par (programme_id, date)
            interface AggRow {
                programmeId: string
                date:        string
                spend:       number
                clicks:      number
                impressions: number
                leads:       number
            }

            const byProgDate = new Map<string, AggRow>()

            for (const row of rows) {
                const programmeId = campaignToProgId.get(row.campaign_id)
                if (!programmeId || !row.date_start) continue

                const key      = `${programmeId}::${row.date_start}`
                const existing = byProgDate.get(key) ?? {
                    programmeId,
                    date:        row.date_start,
                    spend:       0,
                    clicks:      0,
                    impressions: 0,
                    leads:       0,
                }
                existing.spend       += Number(row.spend ?? 0)
                existing.clicks      += Number(row.inline_link_clicks ?? 0)
                existing.impressions += Number(row.impressions ?? 0)
                existing.leads       += parseLeads(row.actions)
                byProgDate.set(key, existing)
            }

            console.log(`[meta-sync] aggregating into daily_ad_metrics rows`)
            console.log(`[meta-sync] aggregated: ${byProgDate.size} unique dates`)

            // Regrouper par programme pour delete + insert séparés
            const byProgramme = new Map<string, AggRow[]>()
            for (const agg of byProgDate.values()) {
                const arr = byProgramme.get(agg.programmeId) ?? []
                arr.push(agg)
                byProgramme.set(agg.programmeId, arr)
            }

            for (const [progId, aggRows] of byProgramme.entries()) {
                console.log(`[meta-sync] DELETE platform=meta date_range=${timeRange.since}→${timeRange.until} programme=${progId}`)

                const { error: delErr } = await supabase
                    .from('daily_ad_metrics')
                    .delete()
                    .eq('program_id', progId)
                    .eq('platform', 'meta')
                    .gte('date', timeRange.since)
                    .lte('date', timeRange.until)

                if (delErr) throw new Error(`Erreur suppression métriques Meta (${progId}) : ${delErr.message}`)

                console.log(`[meta-sync] DELETE done`)
                console.log(`[meta-sync] INSERT ${aggRows.length} rows — programme ${progId}`)

                const insertData = aggRows.map((r) => ({
                    program_id:           progId,
                    date:                 r.date,
                    platform:             'meta' as const,
                    spend:                r.spend,
                    clicks:               r.clicks,
                    impressions:          r.impressions,
                    platform_conversions: Math.round(r.leads),
                    ga4_conversions:      0,
                }))

                const { error: insertErr } = await supabase
                    .from('daily_ad_metrics')
                    .insert(insertData)

                if (insertErr) throw new Error(`Erreur insert métriques Meta (${progId}) : ${insertErr.message}`)

                totalInserted += aggRows.length
                console.log(`[meta-sync] INSERT success — ${aggRows.length} rows for programme ${progId}`)
            }
        }

        console.log(`[meta-sync] DONE success=true daysSynced=${totalInserted}`)

        return {
            success:  true,
            message:  `Synchronisation Meta réussie — ${totalInserted} jours importés.`,
            inserted: totalInserted,
        }

    } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        console.error(`[meta-sync] ERREUR catch global: ${message}`)
        return { success: false, message, inserted: 0 }
    }
}
