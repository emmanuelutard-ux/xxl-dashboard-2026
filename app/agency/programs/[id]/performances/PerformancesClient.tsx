'use client'

import { useState, useMemo } from 'react'
import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'
import { TrendingUp, MousePointerClick, Users, Wallet } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyMetric {
  date: string
  platform: string
  spend: number
  clicks: number
  impressions: number
  platform_conversions: number
}

export interface ProgramMeta {
  budget_google: number
  budget_meta: number
}

interface Props {
  program: ProgramMeta
  metrics: DailyMetric[]
}

type Canal  = 'global' | 'google' | 'meta'
type Period = '7d' | '30d' | '90d' | 'all'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtEur(n: number, d = 2): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d }) + ' €'
}

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay() === 0 ? 7 : d.getDay()
  d.setDate(d.getDate() + 4 - day)
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getFullYear()}-S${String(week).padStart(2, '0')}`
}

function weekLabel(key: string): string {
  const [year, sw] = key.split('-S')
  return `Semaine ${parseInt(sw)} · ${year}`
}

function getCutoff(period: Period): string | null {
  if (period === 'all') return null
  const d = new Date()
  d.setDate(d.getDate() - (period === '7d' ? 7 : period === '30d' ? 30 : 90))
  return d.toISOString().slice(0, 10)
}

function agg(rows: DailyMetric[]) {
  return {
    spend:  rows.reduce((s, r) => s + r.spend, 0),
    leads:  rows.reduce((s, r) => s + r.platform_conversions, 0),
    clicks: rows.reduce((s, r) => s + r.clicks, 0),
    impr:   rows.reduce((s, r) => s + r.impressions, 0),
  }
}

// ─── Tooltip recharts ─────────────────────────────────────────────────────────

interface TooltipEntry { name: string; value: number; color: string; dataKey: string }
interface TooltipProps { active?: boolean; payload?: TooltipEntry[]; label?: string }

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs min-w-[140px]">
      <p className="mb-1.5 font-semibold text-slate-700">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-medium text-slate-900">
            {typeof p.value === 'number' ? fmtEur(p.value) : '–'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function KpiCard({
  icon, bg, label, value, sub,
}: {
  icon: React.ReactNode; bg: string; label: string; value: string; sub?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={cn('mb-2 inline-flex rounded-lg p-2', bg)}>{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  )
}

function CanalSplitCard({
  label, badge, data,
}: {
  label: string; badge: string
  data: { spend: number; leads: number; clicks: number; impr: number }
}) {
  const cpl = data.leads > 0 ? fmtEur(data.spend / data.leads) : '–'
  const ctr = data.impr > 0 ? ((data.clicks / data.impr) * 100).toFixed(2) + ' %' : '–'
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <span className={cn('mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold', badge)}>
        {label}
      </span>
      <dl className="space-y-2">
        {[
          ['Dépensé',         data.spend > 0 ? fmtEur(data.spend, 0) : '–'],
          ['Contacts reçus',  data.leads > 0 ? String(data.leads) : '–'],
          ['CPL',             cpl],
          ['CTR',             ctr],
        ].map(([dt, dd]) => (
          <div key={dt} className="flex justify-between text-sm">
            <dt className="text-slate-500">{dt}</dt>
            <dd className="font-bold text-slate-900">{dd}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function PerformancesClient({ program, metrics }: Props) {
  const [canal, setCanal]   = useState<Canal>('global')
  const [period, setPeriod] = useState<Period>('all')

  // ── Filtres dérivés ────────────────────────────────────────────────────────

  const canalMetrics = useMemo(() =>
    canal === 'global' ? metrics : metrics.filter(m => m.platform === canal),
  [metrics, canal])

  const chartMetrics = useMemo(() => {
    const cutoff = getCutoff(period)
    return cutoff ? canalMetrics.filter(m => m.date >= cutoff) : canalMetrics
  }, [canalMetrics, period])

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const kpis = useMemo(() => {
    const t = agg(canalMetrics)
    return {
      spend:  t.spend,
      leads:  t.leads,
      cpl:    t.leads > 0 ? t.spend / t.leads : null,
      ctr:    t.impr > 0 ? (t.clicks / t.impr) * 100 : null,
    }
  }, [canalMetrics])

  // ── Données du graphique (groupées par date) ───────────────────────────────

  const chartData = useMemo(() => {
    const map = new Map<string, { spend: number; leads: number }>()
    for (const m of chartMetrics) {
      const cur = map.get(m.date) ?? { spend: 0, leads: 0 }
      map.set(m.date, { spend: cur.spend + m.spend, leads: cur.leads + m.platform_conversions })
    }
    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => ({
        label: date.slice(5).split('-').reverse().join('/'),
        spend: Math.round(v.spend * 100) / 100,
        cpl:   v.leads > 0 ? Math.round((v.spend / v.leads) * 100) / 100 : undefined,
      }))
  }, [chartMetrics])

  const tickInterval = Math.max(0, Math.floor(chartData.length / 6) - 1)

  // ── Split canaux (toujours global pour les cartes de canal) ───────────────

  const googleAgg = useMemo(() => agg(metrics.filter(m => m.platform === 'google')), [metrics])
  const metaAgg   = useMemo(() => agg(metrics.filter(m => m.platform === 'meta')), [metrics])

  // ── Tableau des campagnes (groupé par plateforme) ─────────────────────────

  const campaignRows = useMemo(() => {
    return (['google', 'meta'] as const).map(p => {
      const t = agg(metrics.filter(m => m.platform === p))
      return {
        id: p,
        name: p === 'google' ? 'Google Ads' : 'Meta Ads',
        platform: p,
        ...t,
      }
    }).filter(r => r.spend > 0 || r.leads > 0)
  }, [metrics])

  // ── Évolution hebdomadaire ────────────────────────────────────────────────

  const weeklyRows = useMemo(() => {
    // Breakdown Google / Meta toujours sur toutes les données
    const allWeek = new Map<string, { google: number; meta: number }>()
    for (const m of metrics) {
      if (!m.date) continue
      const key = isoWeek(m.date)
      const cur = allWeek.get(key) ?? { google: 0, meta: 0 }
      allWeek.set(key, {
        google: cur.google + (m.platform === 'google' ? m.spend : 0),
        meta:   cur.meta   + (m.platform === 'meta'   ? m.spend : 0),
      })
    }
    // Total / contacts / CPL filtrés par canal
    const canalWeek = new Map<string, { spend: number; leads: number }>()
    for (const m of canalMetrics) {
      if (!m.date) continue
      const key = isoWeek(m.date)
      const cur = canalWeek.get(key) ?? { spend: 0, leads: 0 }
      canalWeek.set(key, { spend: cur.spend + m.spend, leads: cur.leads + m.platform_conversions })
    }

    const keys = new Set([...allWeek.keys(), ...canalWeek.keys()])
    return [...keys]
      .sort((a, b) => b.localeCompare(a))
      .map(key => ({
        key,
        google: allWeek.get(key)?.google ?? 0,
        meta:   allWeek.get(key)?.meta   ?? 0,
        spend:  canalWeek.get(key)?.spend ?? 0,
        leads:  canalWeek.get(key)?.leads ?? 0,
      }))
  }, [metrics, canalMetrics])

  const hasData = metrics.length > 0

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── KPIs globaux ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={<Wallet className="h-4 w-4 text-blue-600" />}
          bg="bg-blue-50"
          label="Total dépensé"
          value={kpis.spend > 0 ? fmtEur(kpis.spend, 0) : '–'}
        />
        <KpiCard
          icon={<Users className="h-4 w-4 text-green-600" />}
          bg="bg-green-50"
          label="Contacts reçus"
          value={kpis.leads > 0 ? String(kpis.leads) : '–'}
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4 text-indigo-600" />}
          bg="bg-indigo-50"
          label="CPL moyen"
          value={kpis.cpl !== null ? fmtEur(kpis.cpl) : '–'}
        />
        <KpiCard
          icon={<MousePointerClick className="h-4 w-4 text-amber-600" />}
          bg="bg-amber-50"
          label="CTR moyen"
          value={kpis.ctr !== null ? kpis.ctr.toFixed(2) + ' %' : '–'}
        />
      </div>

      {/* ── Sélecteurs canal + période ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* Canal */}
        <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white text-sm font-medium shadow-sm">
          {([
            { val: 'global', label: 'Global' },
            { val: 'google', label: 'Google Ads' },
            { val: 'meta',   label: 'Meta Ads' },
          ] as { val: Canal; label: string }[]).map((opt, i) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setCanal(opt.val)}
              className={cn(
                i > 0 && 'border-l border-slate-200',
                'px-4 py-2 transition-colors',
                canal === opt.val
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Période */}
        <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white text-sm font-medium shadow-sm">
          {([
            { val: '7d',  label: '7 jours' },
            { val: '30d', label: '30 jours' },
            { val: '90d', label: '90 jours' },
            { val: 'all', label: 'Depuis le début' },
          ] as { val: Period; label: string }[]).map((opt, i) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setPeriod(opt.val)}
              className={cn(
                i > 0 && 'border-l border-slate-200',
                'px-4 py-2 transition-colors',
                period === opt.val
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Graphique combiné ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Dépenses & CPL quotidiens</h2>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm bg-blue-500" />
              Dépenses (axe G.)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-5 bg-emerald-500" />
              CPL (axe D.)
            </span>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            Aucune donnée sur la période sélectionnée
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                interval={tickInterval}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="spend"
                orientation="left"
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v))}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <YAxis
                yAxisId="cpl"
                orientation="right"
                tickFormatter={(v: number) => `${Math.round(v)}€`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                width={38}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                yAxisId="spend"
                dataKey="spend"
                name="Dépenses"
                fill="#3b82f6"
                radius={[3, 3, 0, 0]}
                maxBarSize={32}
              />
              <Line
                yAxisId="cpl"
                dataKey="cpl"
                name="CPL"
                type="monotone"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Cartes canaux (toujours global) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <CanalSplitCard
          label="Google Ads"
          badge="bg-blue-100 text-blue-700"
          data={googleAgg}
        />
        <CanalSplitCard
          label="Meta Ads"
          badge="bg-indigo-100 text-indigo-700"
          data={metaAgg}
        />
      </div>

      {/* ── Tableau des campagnes ── */}
      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-800">Tableau des campagnes</h2>
        {!hasData || campaignRows.length === 0 ? (
          <EmptyState message="Aucune donnée de campagne disponible." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <th className="px-5 py-3 text-left">Campagne</th>
                  <th className="px-5 py-3 text-left">Canal</th>
                  <th className="px-5 py-3 text-right">Dépenses</th>
                  <th className="px-5 py-3 text-right">Contacts</th>
                  <th className="px-5 py-3 text-right">CPL</th>
                  <th className="px-5 py-3 text-right">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaignRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-900">{r.name}</td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-semibold',
                        r.platform === 'google' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                      )}>
                        {r.platform === 'google' ? 'Google' : 'Meta'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-medium text-slate-800">
                      {r.spend > 0 ? fmtEur(r.spend, 0) : '–'}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-800">
                      {r.leads > 0 ? r.leads : '–'}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {r.leads > 0
                        ? <span className="text-slate-800">{fmtEur(r.spend / r.leads)}</span>
                        : <span className="text-slate-400">–</span>}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {r.impr > 0 ? ((r.clicks / r.impr) * 100).toFixed(2) + ' %' : '–'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Évolution hebdomadaire ── */}
      <section className="pb-8">
        <h2 className="mb-3 text-base font-semibold text-slate-800">
          Évolution hebdomadaire
          {canal !== 'global' && (
            <span className="ml-2 text-xs font-normal text-slate-400">
              (Total & CPL filtrés sur {canal === 'google' ? 'Google Ads' : 'Meta Ads'})
            </span>
          )}
        </h2>
        {weeklyRows.length === 0 ? (
          <EmptyState message="Pas encore de données hebdomadaires." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <th className="px-5 py-3 text-left">Semaine</th>
                  <th className="px-5 py-3 text-right">Dép. Google</th>
                  <th className="px-5 py-3 text-right">Dép. Meta</th>
                  <th className="px-5 py-3 text-right">Total dépensé</th>
                  <th className="px-5 py-3 text-right">Contacts</th>
                  <th className="px-5 py-3 text-right">CPL semaine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {weeklyRows.map((w) => {
                  const weekCpl = w.leads > 0 ? w.spend / w.leads : null
                  return (
                    <tr key={w.key} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-700">{weekLabel(w.key)}</td>
                      <td className="px-5 py-3 text-right text-slate-600">
                        {w.google > 0 ? fmtEur(w.google, 0) : '–'}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-600">
                        {w.meta > 0 ? fmtEur(w.meta, 0) : '–'}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-900">
                        {w.spend > 0 ? fmtEur(w.spend, 0) : '–'}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-800">
                        {w.leads > 0 ? w.leads : '–'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {weekCpl !== null ? (
                          <span className={cn(
                            'font-bold',
                            weekCpl < 20 ? 'text-green-700' :
                            weekCpl < 40 ? 'text-amber-600' : 'text-red-600'
                          )}>
                            {fmtEur(weekCpl)}
                          </span>
                        ) : (
                          <span className="text-slate-400">–</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white">
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  )
}
