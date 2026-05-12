// Page programme fusionnée — mockup 3.2
// Onglets : Performance (détaillé) | Plan média | Campagnes | Brief & cibles | Bilan
// Les 4 derniers onglets sont des placeholders — implémentation PR ultérieure.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Share2, FileText, RefreshCw } from 'lucide-react'
import { KPI }          from '@/components/ds/KPI'
import { Tag }          from '@/components/ds/Tag'
import { PacingBar }    from '@/components/ds/PacingBar'
import { ChannelLogo }  from '@/components/ds/ChannelLogo'
import { AlertCallout } from '@/components/ds/AlertCallout'
import TabBar        from './TabBar'
import CanalPicker   from './CanalPicker'
import PlanMediaTab  from './PlanMediaTab'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

type TabKey   = 'performance' | 'plan' | 'campagnes' | 'brief' | 'bilan'
type CanalKey = 'global' | 'google' | 'meta'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtEur(n: number, decimals = 2): string {
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }) + ' €'
}

function fmtPct(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'
}

function fmtDateStrip(iso: string | null): string {
  if (!iso) return 'N/C'
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function fmtDateYear(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function statusBadge(status: string): { label: string; variant: 'emerald' | 'amber' | 'default' | 'indigo' | 'rose' } {
  const map: Record<string, { label: string; variant: 'emerald' | 'amber' | 'default' | 'indigo' | 'rose' }> = {
    brief:     { label: 'Brief en cours', variant: 'default'  },
    validated: { label: 'Plan validé',    variant: 'indigo'   },
    active:    { label: 'Assets en cours',variant: 'amber'    },
    live:      { label: 'En ligne',       variant: 'emerald'  },
    paused:    { label: 'En pause',       variant: 'amber'    },
    archived:  { label: 'Terminé',        variant: 'default'  },
  }
  return map[status] ?? { label: status, variant: 'default' }
}

// ─── SVG Courbe contacts (Catmull-Rom) ────────────────────────────────────────

function smoothPath(pts: [number, number][], t = 0.35): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1[0] + (p2[0] - p0[0]) * t
    const cp1y = p1[1] + (p2[1] - p0[1]) * t
    const cp2x = p2[0] - (p3[0] - p1[0]) * t
    const cp2y = p2[1] - (p3[1] - p1[1]) * t
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0]} ${p2[1]}`
  }
  return d
}

function ContactsChart({ data }: { data: { date: string; contacts: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-[12px] text-sand-400">
        Aucune donnée sur la période
      </div>
    )
  }

  const W = 600
  const H = 140
  const PAD_L = 36
  const PAD_B = 24
  const innerW = W - PAD_L
  const innerH = H - PAD_B
  const max = Math.max(...data.map(d => d.contacts), 1)
  const step = innerW / Math.max(data.length - 1, 1)

  const pts: [number, number][] = data.map((d, i) => [
    PAD_L + i * step,
    H - PAD_B - (d.contacts / max) * innerH,
  ])

  const linePath = smoothPath(pts)
  const areaPath = pts.length > 0
    ? `${linePath} L ${pts[pts.length - 1][0]} ${H - PAD_B} L ${pts[0][0]} ${H - PAD_B} Z`
    : ''

  const labelEvery = Math.max(1, Math.floor(data.length / 8))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
      <defs>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#FB8500" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FB8500" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line
          key={f}
          x1={PAD_L} y1={H - PAD_B - f * innerH}
          x2={W}     y2={H - PAD_B - f * innerH}
          stroke="#e8e4dc" strokeWidth={1}
        />
      ))}

      {/* Y labels */}
      {[0.5, 1].map(f => (
        <text
          key={f}
          x={PAD_L - 4}
          y={H - PAD_B - f * innerH + 4}
          textAnchor="end"
          fontSize={9}
          fill="#a09880"
        >
          {Math.round(max * f)}
        </text>
      ))}

      {/* Area fill */}
      {areaPath && <path d={areaPath} fill="url(#chart-fill)" />}

      {/* Line */}
      {linePath && (
        <path d={linePath} fill="none" stroke="#FB8500" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Dots + X labels */}
      {pts.map((pt, i) => (
        <g key={i}>
          <circle cx={pt[0]} cy={pt[1]} r={3} fill="#FB8500" />
          {i % labelEvery === 0 && (
            <text x={pt[0]} y={H - 4} textAnchor="middle" fontSize={9} fill="#a09880">
              {data[i].date.slice(8) + '/' + data[i].date.slice(5, 7)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProgramDetailPage({
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ tab?: string; canal?: string }>
}) {
  const { id }                 = await params
  const { tab: rawTab, canal: rawCanal } = await searchParams

  const tab: TabKey   = (['performance', 'plan', 'campagnes', 'brief', 'bilan'] as TabKey[]).includes(rawTab as TabKey)
    ? rawTab as TabKey : 'performance'
  const canal: CanalKey = (['global', 'google', 'meta'] as CanalKey[]).includes(rawCanal as CanalKey)
    ? rawCanal as CanalKey : 'global'

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

  // ── Programme ────────────────────────────────────────────────────────────────
  const { data: program, error } = await supabase
    .from('real_estate_programs')
    .select(`
      id, name, location, status,
      budget_google, budget_meta,
      has_brs, lot_count,
      start_date, end_date,
      target_cpl,
      brief_data
    `)
    .eq('id', id)
    .single()

  if (error || !program) notFound()

  const brief       = program.brief_data as Record<string, unknown> | null
  const promoteur   = brief?.promoteur ? String(brief.promoteur) : null
  const budgetGoogle = Number(program.budget_google) || 0
  const budgetMeta   = Number(program.budget_meta)   || 0
  const budgetTotal  = budgetGoogle + budgetMeta
  const targetCpl    = Number(program.target_cpl) || null
  const isLive       = program.status === 'live' || program.status === 'paused'

  // ── Métriques ────────────────────────────────────────────────────────────────
  const { data: rawMetrics } = await supabase
    .from('daily_ad_metrics')
    .select('date, platform, spend, clicks, impressions, platform_conversions')
    .eq('program_id', id)
    .order('date', { ascending: true })

  const allMetrics = (rawMetrics ?? []).map(r => ({
    date:        r.date as string,
    platform:    r.platform as string,
    spend:       Number(r.spend)                || 0,
    clicks:      Number(r.clicks)               || 0,
    impressions: Number(r.impressions)          || 0,
    contacts:    Number(r.platform_conversions) || 0,
  }))

  // Filtre canal
  const filtered = canal === 'global'
    ? allMetrics
    : allMetrics.filter(m => m.platform === canal)

  // KPIs agrégés
  const totalSpend    = filtered.reduce((s, m) => s + m.spend,       0)
  const totalContacts = filtered.reduce((s, m) => s + m.contacts,    0)
  const totalClicks   = filtered.reduce((s, m) => s + m.clicks,      0)
  const totalImps     = filtered.reduce((s, m) => s + m.impressions, 0)
  const cpl           = totalContacts > 0 ? totalSpend / totalContacts : null
  const ctr           = totalImps     > 0 ? (totalClicks / totalImps) * 100 : null

  // Par plateforme (pour le tableau)
  function platformKpis(platform: 'google' | 'meta') {
    const m = allMetrics.filter(r => r.platform === platform)
    const spend    = m.reduce((s, r) => s + r.spend,       0)
    const contacts = m.reduce((s, r) => s + r.contacts,    0)
    const clicks   = m.reduce((s, r) => s + r.clicks,      0)
    const imps     = m.reduce((s, r) => s + r.impressions, 0)
    return {
      spend, contacts, clicks, imps,
      cpl: contacts > 0 ? spend / contacts : null,
      ctr: imps     > 0 ? (clicks / imps) * 100 : null,
      cpc: clicks   > 0 ? spend / clicks : null,
    }
  }
  const googleKpis = platformKpis('google')
  const metaKpis   = platformKpis('meta')

  // ── Pacing ───────────────────────────────────────────────────────────────────
  let timePct   = 0
  let budgetPct = 0
  let pacingStatus: 'on-track' | 'under' | 'over' = 'on-track'
  let showAlert = false

  if (isLive && program.start_date && program.end_date && budgetTotal > 0) {
    const start = new Date(program.start_date as string).getTime()
    const end   = new Date(program.end_date   as string).getTime()
    const now   = Date.now()
    if (end > start && now > start) {
      timePct   = Math.round(Math.min(100, ((now - start) / (end - start)) * 100))
      budgetPct = Math.round(Math.min(100, (totalSpend / budgetTotal) * 100))
      const gap = timePct - budgetPct
      pacingStatus = gap > 15 ? 'under' : gap < -15 ? 'over' : 'on-track'
      showAlert    = gap > 20
    }
  }

  // ── Chart data — par jour ─────────────────────────────────────────────────
  const byDay = new Map<string, number>()
  for (const m of filtered) {
    byDay.set(m.date, (byDay.get(m.date) ?? 0) + m.contacts)
  }
  const chartData = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, contacts]) => ({ date, contacts }))

  // ── Date strip ───────────────────────────────────────────────────────────────
  const startShort  = fmtDateStrip(program.start_date as string | null)
  const endFull     = fmtDateYear(program.end_date   as string | null)
  const datesLabel  = program.start_date && program.end_date
    ? `${startShort} → ${endFull}`
    : 'Dates non définies'

  // ── Statut badge ─────────────────────────────────────────────────────────────
  const { label: statusLabel, variant: statusVariant } = statusBadge(program.status)

  // ── Alerte callout texte ──────────────────────────────────────────────────────
  const alertBody = showAlert && cpl !== null && targetCpl !== null
    ? `${timePct}% du temps écoulé mais seulement ${budgetPct}% du budget consommé. Le CPL est à ${fmtEur(cpl, 0)} contre ${fmtEur(targetCpl, 0)} visés.`
    : showAlert
    ? `${timePct}% du temps écoulé mais seulement ${budgetPct}% du budget consommé.`
    : ''

  return (
    <div className="flex flex-col h-full">

      {/* ── TopBar ── */}
      <header className="flex items-center justify-between pl-14 pr-4 md:px-6 py-3.5 border-b border-sand-200 bg-white shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[13px]">
          <Link href="/agency/programs" className="text-sand-500 hover:text-sand-800 transition-colors">
            Programmes
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-sand-300" />
          <span className="font-semibold text-sand-900">{program.name}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-ds-md border border-sand-200 text-sand-500 hover:border-sand-300 hover:text-sand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Synchroniser les données publicitaires"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Synchroniser
          </button>
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-ds-md border border-sand-200 text-sand-500 hover:border-sand-300 hover:text-sand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Share2 className="h-3.5 w-3.5" />
            Partager au client
          </button>
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-ds-md border border-sand-200 text-sand-500 hover:border-sand-300 hover:text-sand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="h-3.5 w-3.5" />
            Bilan PDF
          </button>
        </div>
      </header>

      {/* ── Contenu scrollable ── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">

          {/* ── Strip statut ── */}
          <div className="flex flex-wrap items-center gap-0 rounded-[10px] border border-sand-200 bg-white divide-x divide-sand-200 shadow-ds-sm overflow-hidden">

            {/* Statut */}
            <div className="px-4 py-3 shrink-0">
              <Tag variant={statusVariant}>{statusLabel}</Tag>
            </div>

            {/* Promoteur + ville + lots */}
            <div className="px-4 py-3 flex-1 min-w-0">
              <p className="text-[11px] text-sand-400 leading-none mb-1">Programme</p>
              <p className="text-[13px] font-medium text-sand-900 leading-tight truncate">
                {promoteur && <span>{promoteur} · </span>}
                {program.location ?? '—'}
                {program.lot_count && <span className="text-sand-500"> · {program.lot_count} lots</span>}
                {program.has_brs && <span className="ml-1.5 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-1.5 py-0.5">BRS</span>}
              </p>
            </div>

            {/* Dates */}
            <div className="px-4 py-3 shrink-0">
              <p className="text-[11px] text-sand-400 leading-none mb-1">Période</p>
              <p className="text-[13px] font-medium tabular-nums text-sand-900">{datesLabel}</p>
            </div>

            {/* Budget + barre */}
            <div className="px-4 py-3 w-52 shrink-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-sand-400 leading-none">Budget</p>
                <p className="text-[11px] tabular-nums text-sand-600">
                  {totalSpend > 0
                    ? `${fmtEur(totalSpend, 0)} / ${fmtEur(budgetTotal, 0)}`
                    : fmtEur(budgetTotal, 0)}
                </p>
              </div>
              {budgetTotal > 0 && isLive ? (
                <PacingBar timePct={timePct} budgetPct={budgetPct} status={pacingStatus} />
              ) : (
                <div className="h-1.5 w-full rounded-ds-full bg-sand-100" />
              )}
            </div>

          </div>

          {/* ── Callout alerte pacing ── */}
          {showAlert && (
            <AlertCallout
              title="Cette campagne sous-performe"
              body={alertBody}
              action="Action recommandée : activer Meta et revoir les enchères Google"
            />
          )}

          {/* ── Onglets ── */}
          <TabBar current={tab} />

          {/* ── Contenu Performance ── */}
          {tab === 'performance' && (
            <div className="space-y-5">

              {/* Canal picker */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-[12px] text-sand-500">Données cumulées depuis le lancement</p>
                <CanalPicker current={canal} />
              </div>

              {/* 4 KPI cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <KPI
                  label="Total dépensé"
                  value={totalSpend > 0 ? fmtEur(totalSpend, 0) : '–'}
                  tone="default"
                />
                <KPI
                  label="Contacts reçus"
                  value={totalContacts > 0 ? totalContacts.toLocaleString('fr-FR') : '–'}
                  tone="default"
                />
                <KPI
                  label="CPL moyen"
                  value={cpl !== null ? fmtEur(cpl, 2) : 'N/C'}
                  tone={
                    cpl === null ? 'default'
                    : targetCpl && cpl <= targetCpl * 1.1 ? 'success'
                    : targetCpl && cpl > targetCpl * 1.5  ? 'danger'
                    : 'warning'
                  }
                  sub={targetCpl ? `cible : ${fmtEur(targetCpl, 0)}` : undefined}
                />
                <KPI
                  label="CTR moyen"
                  value={ctr !== null ? fmtPct(ctr) : 'N/C'}
                  tone="default"
                />
              </div>

              {/* Tableau détail par régie */}
              <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-sand-100">
                  <p className="text-[13px] font-semibold text-sand-900">Détail par régie</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-sand-100 bg-sand-50">
                        <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Régie</th>
                        <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Dépensé</th>
                        <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Contacts</th>
                        <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-sand-500 tracking-[0.04em]">CPL</th>
                        <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-sand-500 tracking-[0.04em]">CTR</th>
                        <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-sand-500 tracking-[0.04em]">CPC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand-100">
                      {([
                        { platform: 'google' as const, kpis: googleKpis, budget: budgetGoogle },
                        { platform: 'meta'   as const, kpis: metaKpis,   budget: budgetMeta   },
                      ]).map(({ platform, kpis, budget }) => {
                        const inactive = budget === 0
                        return (
                          <tr
                            key={platform}
                            className={inactive ? 'opacity-40' : 'hover:bg-sand-50 transition-colors'}
                          >
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <ChannelLogo channel={platform} size={14} />
                                <span className="font-medium text-sand-900 capitalize">
                                  {platform === 'google' ? 'Google Ads' : 'Meta Ads'}
                                </span>
                                {inactive && (
                                  <span className="text-[10px] text-sand-400">non activé</span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums text-sand-800 font-medium">
                              {kpis.spend > 0 ? fmtEur(kpis.spend, 0) : '–'}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums text-sand-800 font-medium">
                              {kpis.contacts > 0 ? kpis.contacts.toLocaleString('fr-FR') : '–'}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums font-semibold">
                              {kpis.cpl !== null
                                ? <span className={
                                    targetCpl && kpis.cpl <= targetCpl * 1.1
                                      ? 'text-emerald-700'
                                      : targetCpl && kpis.cpl > targetCpl * 1.5
                                      ? 'text-rose-700'
                                      : 'text-amber-700'
                                  }>{fmtEur(kpis.cpl, 2)}</span>
                                : <span className="text-sand-400">–</span>
                              }
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums text-sand-700">
                              {kpis.ctr !== null ? fmtPct(kpis.ctr) : '–'}
                            </td>
                            <td className="px-5 py-3 text-right tabular-nums text-sand-700">
                              {kpis.cpc !== null ? fmtEur(kpis.cpc, 2) : '–'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Graphique contacts */}
              <div className="rounded-[10px] border border-sand-200 bg-white p-5 shadow-ds-sm">
                <p className="text-[13px] font-semibold text-sand-900 mb-4">
                  Évolution des contacts reçus
                </p>
                <ContactsChart data={chartData} />
              </div>

            </div>
          )}

          {/* ── Onglet Plan média ── */}
          {tab === 'plan' && (
            <PlanMediaTab
              briefData={brief}
              budgetGoogle={budgetGoogle}
              budgetMeta={budgetMeta}
              hasBrs={Boolean(program.has_brs)}
            />
          )}

          {/* ── Placeholders onglets non implémentés ── */}
          {(tab === 'campagnes' || tab === 'brief' || tab === 'bilan') && (
            <div className="rounded-[10px] border border-dashed border-sand-300 bg-white py-16 text-center">
              <p className="text-[13px] font-medium text-sand-500">Section en cours de construction</p>
              <p className="mt-1 text-[12px] text-sand-400">Disponible dans une prochaine mise à jour.</p>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
