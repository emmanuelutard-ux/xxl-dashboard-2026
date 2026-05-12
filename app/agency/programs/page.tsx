// Liste des programmes — mockup 3.2-bis
// Remplace le kanban confus par une table scannable avec filtres.
// Lien direct vers /agency/programs/[id] (PR3).

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, LayoutList } from 'lucide-react'
import { Tag }       from '@/components/ds/Tag'
import type { TagVariant } from '@/components/ds/Tag'
import FilterTabs    from './FilterTabs'

export const dynamic = 'force-dynamic'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtEur(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}

function fmtDateShort(iso: string | null): string {
  if (!iso) return '—'
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function fmtDateYear(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

const STATUS_CONFIG: Record<string, { label: string; variant: TagVariant }> = {
  brief:     { label: 'Brief en cours',  variant: 'default'  },
  validated: { label: 'Plan validé',     variant: 'indigo'   },
  active:    { label: 'Assets en cours', variant: 'amber'    },
  live:      { label: 'En ligne',        variant: 'emerald'  },
  paused:    { label: 'En pause',        variant: 'amber'    },
  archived:  { label: 'Terminé',         variant: 'default'  },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProgramsListPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter = 'all' } = await searchParams

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Fetch programmes ─────────────────────────────────────────────────────────
  const { data: programs, error } = await supabase
    .from('real_estate_programs')
    .select(`
      id, name, location, status,
      budget_google, budget_meta,
      has_brs, lot_count,
      start_date, end_date,
      target_cpl, brief_data
    `)
    .order('created_at', { ascending: false })

  if (error || !programs) {
    return <div className="p-8 text-rose-500">Erreur chargement : {error?.message}</div>
  }

  // ── Métriques (tous les programmes non archivés actifs) ───────────────────
  const activeIds = programs
    .filter(p => p.status !== 'archived')
    .map(p => p.id)

  const metricsMap: Record<string, { spent: number; contacts: number }> = {}

  if (activeIds.length > 0) {
    const { data: metrics } = await supabase
      .from('daily_ad_metrics')
      .select('program_id, spend, platform_conversions')
      .in('program_id', activeIds)

    for (const m of metrics ?? []) {
      if (!metricsMap[m.program_id]) metricsMap[m.program_id] = { spent: 0, contacts: 0 }
      metricsMap[m.program_id].spent    += Number(m.spend)                || 0
      metricsMap[m.program_id].contacts += Number(m.platform_conversions) || 0
    }
  }

  // ── Enrichissement ────────────────────────────────────────────────────────
  const enriched = programs.map(p => {
    const brief      = p.brief_data as Record<string, unknown> | null
    const promoteur  = brief?.promoteur ? String(brief.promoteur) : null
    const budgetTotal = (Number(p.budget_google) || 0) + (Number(p.budget_meta) || 0)
    const targetCpl   = Number(p.target_cpl) || null
    const m           = metricsMap[p.id] ?? { spent: 0, contacts: 0 }
    const cpl         = m.contacts > 0 ? m.spent / m.contacts : null
    const budgetPct   = budgetTotal > 0 ? Math.round((m.spent / budgetTotal) * 100) : null

    // Pacing gap pour "À l'aide"
    let timePct = 0
    let pacingGap = 0
    const isLive = p.status === 'live' || p.status === 'paused'
    if (isLive && p.start_date && p.end_date && budgetTotal > 0) {
      const start = new Date(p.start_date as string).getTime()
      const end   = new Date(p.end_date   as string).getTime()
      const now   = Date.now()
      if (end > start && now > start) {
        timePct   = Math.round(Math.min(100, ((now - start) / (end - start)) * 100))
        pacingGap = timePct - (budgetPct ?? 0)
      }
    }

    return {
      id: p.id as string,
      name: p.name as string,
      location: p.location as string | null,
      status: p.status as string,
      promoteur,
      has_brs: Boolean(p.has_brs),
      lot_count: p.lot_count as number | null,
      start_date: p.start_date as string | null,
      end_date: p.end_date as string | null,
      budgetTotal,
      budgetPct,
      targetCpl,
      spent: m.spent,
      contacts: m.contacts,
      cpl,
      isAlert: isLive && pacingGap > 20,
    }
  })

  // ── Compteurs pour les tabs ───────────────────────────────────────────────
  const counts = {
    all:      enriched.length,
    live:     enriched.filter(p => p.status === 'live').length,
    alert:    enriched.filter(p => p.isAlert).length,
    archived: enriched.filter(p => p.status === 'archived').length,
  }

  // ── Filtrage ─────────────────────────────────────────────────────────────
  const filtered = (() => {
    switch (filter) {
      case 'live':     return enriched.filter(p => p.status === 'live')
      case 'alert':    return enriched.filter(p => p.isAlert)
      case 'archived': return enriched.filter(p => p.status === 'archived')
      default:         return enriched
    }
  })()

  const filterOptions = [
    { key: 'all',      label: 'Tous',      count: counts.all      },
    { key: 'live',     label: 'En ligne',  count: counts.live     },
    { key: 'alert',    label: 'À l\'aide', count: counts.alert    },
    { key: 'archived', label: 'Terminés',  count: counts.archived },
  ]

  return (
    <div className="flex flex-col h-full">

      {/* ── TopBar ── */}
      <header className="flex items-center justify-between pl-14 pr-4 md:px-6 py-3.5 border-b border-sand-200 bg-white shrink-0">
        <div>
          <div className="text-xs text-sand-500 mb-0.5">Programmes</div>
          <div className="text-lg font-semibold text-sand-900">
            {enriched.length} programme{enriched.length !== 1 ? 's' : ''} au total
          </div>
        </div>
        <Link
          href="/agency/briefs/nouveau"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-ds-md bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          + Nouveau brief
        </Link>
      </header>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-6xl mx-auto space-y-4">

          {/* Filtres */}
          <FilterTabs options={filterOptions} current={filter} />

          {/* Liste */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 rounded-[10px] border border-dashed border-sand-200 bg-white text-center">
              <LayoutList className="mb-3 h-8 w-8 text-sand-300" />
              <p className="text-[13px] font-medium text-sand-600">Aucun programme dans cette catégorie</p>
              <p className="mt-1 text-[12px] text-sand-400">Modifiez le filtre ou créez un nouveau brief.</p>
              <Link
                href="/agency/briefs/nouveau"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-ds-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                + Nouveau brief
              </Link>
            </div>
          ) : (
            <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-sand-100 bg-sand-50">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Programme</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Statut</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Période</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Budget</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-sand-500 tracking-[0.04em]">CPL</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-sand-500 tracking-[0.04em]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {filtered.map(p => {
                    const { label: statusLabel, variant: statusVariant } = STATUS_CONFIG[p.status] ?? { label: p.status, variant: 'default' as TagVariant }

                    // CPL coloring
                    let cplClass = 'text-sand-400'
                    let cplLabel = '–'
                    if (p.cpl !== null) {
                      cplLabel = fmtEur(p.cpl)
                      if (p.targetCpl) {
                        cplClass = p.cpl <= p.targetCpl * 1.1
                          ? 'text-emerald-700'
                          : p.cpl > p.targetCpl * 1.5
                          ? 'text-rose-700'
                          : 'text-amber-700'
                      } else {
                        cplClass = 'text-sand-800'
                      }
                    }

                    return (
                      <tr
                        key={p.id}
                        className="group hover:bg-sand-50 transition-colors cursor-pointer"
                      >
                        {/* Programme */}
                        <td className="px-5 py-3.5">
                          <Link href={`/agency/programs/${p.id}`} className="block">
                            <p className="font-semibold text-sand-900 group-hover:text-indigo-700 transition-colors leading-tight">
                              {p.name}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] text-sand-500">
                              {p.promoteur && <span>{p.promoteur}</span>}
                              {p.promoteur && p.location && <span>·</span>}
                              {p.location && <span>{p.location}</span>}
                              {p.lot_count && (
                                <>
                                  <span>·</span>
                                  <span>{p.lot_count} lots</span>
                                </>
                              )}
                              {p.has_brs && (
                                <span className="ml-1 inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600">
                                  BRS
                                </span>
                              )}
                              {p.isAlert && (
                                <span className="ml-1 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                                  Sous-conso
                                </span>
                              )}
                            </div>
                          </Link>
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-3.5">
                          <Link href={`/agency/programs/${p.id}`} className="block">
                            <Tag variant={statusVariant}>{statusLabel}</Tag>
                          </Link>
                        </td>

                        {/* Période */}
                        <td className="px-4 py-3.5">
                          <Link href={`/agency/programs/${p.id}`} className="block tabular-nums text-sand-700">
                            {p.start_date && p.end_date
                              ? `${fmtDateShort(p.start_date)} → ${fmtDateYear(p.end_date)}`
                              : <span className="text-sand-400">Non définies</span>
                            }
                          </Link>
                        </td>

                        {/* Budget + mini-barre */}
                        <td className="px-4 py-3.5 w-40">
                          <Link href={`/agency/programs/${p.id}`} className="block">
                            {p.budgetTotal > 0 ? (
                              <>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="tabular-nums text-sand-700">
                                    {p.spent > 0 ? fmtEur(p.spent) : '–'}
                                  </span>
                                  <span className="text-[10px] text-sand-400 tabular-nums">
                                    / {fmtEur(p.budgetTotal)}
                                  </span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-sand-100">
                                  <div
                                    className={[
                                      'h-full rounded-full',
                                      p.isAlert ? 'bg-amber-400' : 'bg-indigo-400',
                                    ].join(' ')}
                                    style={{ width: `${Math.min(p.budgetPct ?? 0, 100)}%` }}
                                  />
                                </div>
                              </>
                            ) : (
                              <span className="text-sand-400">–</span>
                            )}
                          </Link>
                        </td>

                        {/* CPL */}
                        <td className="px-4 py-3.5 text-right">
                          <Link href={`/agency/programs/${p.id}`} className="block">
                            <span className={`font-semibold tabular-nums ${cplClass}`}>
                              {cplLabel}
                            </span>
                            {p.targetCpl && p.cpl !== null && (
                              <p className="text-[10px] text-sand-400 tabular-nums">
                                cible {fmtEur(p.targetCpl)}
                              </p>
                            )}
                          </Link>
                        </td>

                        {/* Lien ouvrir */}
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href={`/agency/programs/${p.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Ouvrir
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
