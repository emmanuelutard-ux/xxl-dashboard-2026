import { KPI } from '@/components/ds/KPI'
import { ChannelLogo } from '@/components/ds/ChannelLogo'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import BilanPeriodPicker from './BilanPeriodPicker'

type Period = '7j' | '30j' | '90j' | 'total'

interface Metric {
  date: string
  platform: string
  spend: number
  contacts: number
  clicks: number
  impressions: number
}

interface BilanTabProps {
  allMetrics: Metric[]
  period: Period
  budgetGoogle: number
  budgetMeta: number
  targetCpl: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtEur(n: number, d = 2): string {
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }) + ' €'
}

function fmtPct(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'
}

function cutoffDate(period: Period): string | null {
  if (period === 'total') return null
  const days = period === '7j' ? 7 : period === '30j' ? 30 : 90
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function filterByPeriod(metrics: Metric[], period: Period): Metric[] {
  const cutoff = cutoffDate(period)
  if (!cutoff) return metrics
  return metrics.filter(m => m.date >= cutoff)
}

function platformKpis(metrics: Metric[], platform: 'google' | 'meta') {
  const m = metrics.filter(r => r.platform === platform)
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

// ─── SVG Chart contacts multi-séries ─────────────────────────────────────────

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

function DualContactsChart({
  googleData,
  metaData,
}: {
  googleData: { date: string; contacts: number }[]
  metaData:   { date: string; contacts: number }[]
}) {
  const allDates = [...new Set([
    ...googleData.map(d => d.date),
    ...metaData.map(d => d.date),
  ])].sort()

  if (allDates.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-[12px] text-sand-400">
        Aucune donnée sur la période sélectionnée
      </div>
    )
  }

  const gMap = new Map(googleData.map(d => [d.date, d.contacts]))
  const mMap = new Map(metaData.map(d => [d.date, d.contacts]))

  const W = 600
  const H = 150
  const PAD_L = 36
  const PAD_B = 24
  const innerW = W - PAD_L
  const innerH = H - PAD_B

  const maxVal = Math.max(...allDates.map(d => Math.max(gMap.get(d) ?? 0, mMap.get(d) ?? 0)), 1)
  const step   = innerW / Math.max(allDates.length - 1, 1)

  const gPts: [number, number][] = allDates.map((d, i) => [
    PAD_L + i * step,
    H - PAD_B - ((gMap.get(d) ?? 0) / maxVal) * innerH,
  ])
  const mPts: [number, number][] = allDates.map((d, i) => [
    PAD_L + i * step,
    H - PAD_B - ((mMap.get(d) ?? 0) / maxVal) * innerH,
  ])

  const gLine = smoothPath(gPts)
  const mLine = smoothPath(mPts)

  const gArea = gPts.length > 1
    ? `${gLine} L ${gPts[gPts.length - 1][0]} ${H - PAD_B} L ${gPts[0][0]} ${H - PAD_B} Z`
    : ''
  const mArea = mPts.length > 1
    ? `${mLine} L ${mPts[mPts.length - 1][0]} ${H - PAD_B} L ${mPts[0][0]} ${H - PAD_B} Z`
    : ''

  const labelEvery = Math.max(1, Math.floor(allDates.length / 8))

  const hasGoogle = googleData.some(d => d.contacts > 0)
  const hasMeta   = metaData.some(d => d.contacts > 0)

  return (
    <div>
      {/* Légende */}
      <div className="flex items-center gap-4 mb-3">
        {hasGoogle && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-[#FB8500] inline-block" />
            <span className="text-[11px] text-sand-500">Google</span>
          </div>
        )}
        {hasMeta && (
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-[#023047] inline-block" />
            <span className="text-[11px] text-sand-500">Meta</span>
          </div>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
        <defs>
          <linearGradient id="bilan-g-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FB8500" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#FB8500" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="bilan-m-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#023047" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#023047" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map(f => (
          <line
            key={f}
            x1={PAD_L} y1={H - PAD_B - f * innerH}
            x2={W}     y2={H - PAD_B - f * innerH}
            stroke="#e8e4dc" strokeWidth={1}
          />
        ))}

        {[0.5, 1].map(f => (
          <text key={f} x={PAD_L - 4} y={H - PAD_B - f * innerH + 4}
            textAnchor="end" fontSize={9} fill="#a09880">
            {Math.round(maxVal * f)}
          </text>
        ))}

        {gArea && hasGoogle && <path d={gArea} fill="url(#bilan-g-fill)" />}
        {mArea && hasMeta   && <path d={mArea} fill="url(#bilan-m-fill)" />}

        {gLine && hasGoogle && (
          <path d={gLine} fill="none" stroke="#FB8500" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}
        {mLine && hasMeta && (
          <path d={mLine} fill="none" stroke="#023047" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {allDates.map((date, i) => (
          <g key={date}>
            {hasGoogle && <circle cx={gPts[i][0]} cy={gPts[i][1]} r={2.5} fill="#FB8500" />}
            {hasMeta   && <circle cx={mPts[i][0]} cy={mPts[i][1]} r={2.5} fill="#023047" />}
            {i % labelEvery === 0 && (
              <text x={gPts[i][0]} y={H - 4} textAnchor="middle" fontSize={9} fill="#a09880">
                {date.slice(8) + '/' + date.slice(5, 7)}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  )
}

// ─── Recommandations ─────────────────────────────────────────────────────────

function Recommendations({
  gKpis,
  mKpis,
  totalContacts,
  targetCpl,
}: {
  gKpis:         ReturnType<typeof platformKpis>
  mKpis:         ReturnType<typeof platformKpis>
  totalContacts: number
  targetCpl:     number | null
}) {
  const items: { tone: 'good' | 'warn' | 'neutral'; text: string }[] = []

  // Meilleur canal
  if (gKpis.cpl !== null && mKpis.cpl !== null) {
    const best = gKpis.cpl <= mKpis.cpl ? 'Google Ads' : 'Meta Ads'
    const cpl  = gKpis.cpl <= mKpis.cpl ? gKpis.cpl : mKpis.cpl
    items.push({
      tone: 'good',
      text: `${best} est le canal le plus efficace avec un CPL de ${fmtEur(cpl, 2)}.`,
    })
  }

  // Comparaison benchmark cible
  const globalCpl = totalContacts > 0
    ? (gKpis.spend + mKpis.spend) / totalContacts
    : null

  if (globalCpl !== null) {
    if (targetCpl && globalCpl <= targetCpl) {
      items.push({
        tone: 'good',
        text: `CPL global de ${fmtEur(globalCpl, 2)} — en dessous de l'objectif de ${fmtEur(targetCpl, 0)}.`,
      })
    } else if (targetCpl && globalCpl > targetCpl * 1.5) {
      items.push({
        tone: 'warn',
        text: `CPL global de ${fmtEur(globalCpl, 2)} — dépasse l'objectif de ${fmtEur(targetCpl, 0)} de plus de 50 %.`,
      })
    } else if (globalCpl <= 20) {
      items.push({
        tone: 'good',
        text: `CPL global de ${fmtEur(globalCpl, 2)} — sous le benchmark secteur de 20 €.`,
      })
    } else {
      items.push({
        tone: 'warn',
        text: `CPL global de ${fmtEur(globalCpl, 2)} — au-dessus du benchmark secteur de 20 €.`,
      })
    }
  }

  // CTR Google
  if (gKpis.ctr !== null) {
    if (gKpis.ctr < 1.5) {
      items.push({
        tone: 'warn',
        text: `CTR Google de ${fmtPct(gKpis.ctr)} — en dessous du seuil de 1,5 %. Revoir les annonces RSA.`,
      })
    } else {
      items.push({
        tone: 'good',
        text: `CTR Google de ${fmtPct(gKpis.ctr)} — performances annonces satisfaisantes.`,
      })
    }
  }

  if (items.length === 0) {
    items.push({ tone: 'neutral', text: 'Aucune donnée suffisante pour générer des recommandations.' })
  }

  return (
    <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-sand-100">
        <p className="text-[13px] font-semibold text-sand-900">Analyse</p>
      </div>
      <ul className="divide-y divide-sand-100">
        {items.map((item, i) => (
          <li key={i} className="px-5 py-3.5 flex items-start gap-3">
            {item.tone === 'good'
              ? <TrendingUp  className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              : item.tone === 'warn'
              ? <TrendingDown className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              : <Minus        className="h-4 w-4 text-sand-400 mt-0.5 shrink-0" />
            }
            <p className="text-[13px] text-sand-800">{item.text}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Tab ─────────────────────────────────────────────────────────────────────

export default function BilanTab({
  allMetrics,
  period,
  budgetGoogle,
  budgetMeta,
  targetCpl,
}: BilanTabProps) {
  const metrics = filterByPeriod(allMetrics, period)

  const totalSpend    = metrics.reduce((s, m) => s + m.spend,       0)
  const totalContacts = metrics.reduce((s, m) => s + m.contacts,    0)
  const totalClicks   = metrics.reduce((s, m) => s + m.clicks,      0)
  const totalImps     = metrics.reduce((s, m) => s + m.impressions, 0)
  const cpl           = totalContacts > 0 ? totalSpend / totalContacts : null
  const ctr           = totalImps     > 0 ? (totalClicks / totalImps) * 100 : null

  const budgetTotal = budgetGoogle + budgetMeta

  const gKpis = platformKpis(metrics, 'google')
  const mKpis = platformKpis(metrics, 'meta')

  // Séries chart
  const googleByDay = new Map<string, number>()
  const metaByDay   = new Map<string, number>()
  for (const m of metrics) {
    if (m.platform === 'google') googleByDay.set(m.date, (googleByDay.get(m.date) ?? 0) + m.contacts)
    if (m.platform === 'meta')   metaByDay.set(m.date,   (metaByDay.get(m.date)   ?? 0) + m.contacts)
  }
  const googleSeries = [...googleByDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, contacts]) => ({ date, contacts }))
  const metaSeries   = [...metaByDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, contacts]) => ({ date, contacts }))

  const PERIOD_LABELS: Record<Period, string> = {
    '7j':    '7 derniers jours',
    '30j':   '30 derniers jours',
    '90j':   '90 derniers jours',
    'total': 'depuis le lancement',
  }

  return (
    <div className="space-y-5">

      {/* En-tête période */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] text-sand-500">
          Données {PERIOD_LABELS[period]}
        </p>
        <BilanPeriodPicker current={period} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPI
          label="Total dépensé"
          value={totalSpend > 0 ? fmtEur(totalSpend, 0) : '–'}
          sub={budgetTotal > 0 ? `budget : ${fmtEur(budgetTotal, 0)}` : undefined}
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
            cpl === null       ? 'default'
            : targetCpl && cpl <= targetCpl * 1.1 ? 'success'
            : targetCpl && cpl >  targetCpl * 1.5 ? 'danger'
            : 'warning'
          }
          sub={targetCpl ? `cible : ${fmtEur(targetCpl, 0)}` : 'benchmark : < 20 €'}
        />
        <KPI
          label="CTR moyen"
          value={ctr !== null ? fmtPct(ctr) : 'N/C'}
          tone="default"
        />
      </div>

      {/* Graphique multi-séries */}
      <div className="rounded-[10px] border border-sand-200 bg-white p-5 shadow-ds-sm">
        <p className="text-[13px] font-semibold text-sand-900 mb-4">
          Évolution des contacts reçus
        </p>
        <DualContactsChart googleData={googleSeries} metaData={metaSeries} />
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
                <th className="px-5 py-2.5 text-left   text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Régie</th>
                <th className="px-5 py-2.5 text-right  text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Dépensé</th>
                <th className="px-5 py-2.5 text-right  text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Contacts</th>
                <th className="px-5 py-2.5 text-right  text-[11px] font-semibold text-sand-500 tracking-[0.04em]">CPL</th>
                <th className="px-5 py-2.5 text-right  text-[11px] font-semibold text-sand-500 tracking-[0.04em]">CTR</th>
                <th className="px-5 py-2.5 text-right  text-[11px] font-semibold text-sand-500 tracking-[0.04em]">CPC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {([
                { platform: 'google' as const, kpis: gKpis, budget: budgetGoogle },
                { platform: 'meta'   as const, kpis: mKpis, budget: budgetMeta   },
              ]).map(({ platform, kpis, budget }) => {
                const inactive = budget === 0
                return (
                  <tr key={platform} className={inactive ? 'opacity-40' : 'hover:bg-sand-50 transition-colors'}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <ChannelLogo channel={platform} size={14} />
                        <span className="font-medium text-sand-900">
                          {platform === 'google' ? 'Google Ads' : 'Meta Ads'}
                        </span>
                        {inactive && <span className="text-[10px] text-sand-400">non activé</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-sand-800 font-medium">
                      {kpis.spend > 0 ? fmtEur(kpis.spend, 0) : '–'}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-sand-800 font-medium">
                      {kpis.contacts > 0 ? kpis.contacts.toLocaleString('fr-FR') : '–'}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums font-semibold">
                      {kpis.cpl !== null ? (
                        <span className={
                          targetCpl && kpis.cpl <= targetCpl * 1.1 ? 'text-emerald-700'
                          : targetCpl && kpis.cpl > targetCpl * 1.5 ? 'text-rose-700'
                          : 'text-amber-700'
                        }>
                          {fmtEur(kpis.cpl, 2)}
                        </span>
                      ) : (
                        <span className="text-sand-400">–</span>
                      )}
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

      {/* Recommandations */}
      <Recommendations
        gKpis={gKpis}
        mKpis={mKpis}
        totalContacts={totalContacts}
        targetCpl={targetCpl}
      />

    </div>
  )
}
