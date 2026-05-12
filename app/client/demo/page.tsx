// ⚠️ DEMO MODE - DO NOT MERGE TO MAIN
// Page de démonstration sans authentification — Résidence Galliéni
// Utilise le service role key pour contourner les RLS.
// Brancher via demo/client-no-auth uniquement.

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { MapPin, Users, Coins, Wallet, Clock, Download } from 'lucide-react'
import PeriodPicker from './PeriodPicker'

export const dynamic = 'force-dynamic'

const GALLIENI_ID = 'b7b49362-9899-4bec-a553-0a2f90ad8ea0'

const PERIODS = {
  '7':   7,
  '30':  30,
  '90':  90,
  'all': null,
} as const

type PeriodKey = keyof typeof PERIODS

function fmtEur(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}

function daysLeft(endDate: string | null): string {
  if (!endDate) return 'N/C'
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86_400_000)
  if (diff < 0) return 'Terminé'
  if (diff === 0) return "Aujourd'hui"
  return `${diff} jour${diff > 1 ? 's' : ''}`
}

function cutoffFromDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function fmtDateShort(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon, bg, label, value, sub,
}: {
  icon: React.ReactNode; bg: string; label: string; value: string; sub?: React.ReactNode
}) {
  return (
    <div className="rounded-[10px] border border-sand-200 bg-white p-5 shadow-ds-sm">
      <div className={`mb-3 inline-flex rounded-lg p-2.5 ${bg}`}>{icon}</div>
      <p className="text-[11px] text-sand-500">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tabular-nums text-sand-900">{value}</p>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  )
}

// ─── Budget bar ────────────────────────────────────────────────────────────────

function BudgetBar({ spent, total }: { spent: number; total: number }) {
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand-100">
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[11px] tabular-nums text-sand-400">
        sur {fmtEur(total)} ({Math.round(pct)} %)
      </p>
    </div>
  )
}

// ─── SVG bar chart ─────────────────────────────────────────────────────────────

function BarChart({ data }: { data: { label: string; contacts: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-[13px] text-sand-400">
        Aucune donnée sur la période sélectionnée
      </div>
    )
  }

  const max = Math.max(...data.map(d => d.contacts), 1)
  const W = 600
  const H = 160
  const step = W / data.length
  const barW = Math.max(3, Math.min(18, step - 5))
  const labelEvery = Math.max(1, Math.floor(data.length / 8))

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" aria-hidden="true">
      {/* Gridlines */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <line
          key={f}
          x1={0} y1={H - f * H}
          x2={W} y2={H - f * H}
          stroke="#e8e4dc"
          strokeWidth={1}
        />
      ))}
      {/* Bars */}
      {data.map((d, i) => {
        const barH = Math.max(2, (d.contacts / max) * H)
        const x = i * step + step / 2
        return (
          <g key={i}>
            <rect
              x={x - barW / 2}
              y={H - barH}
              width={barW}
              height={barH}
              fill="#4f46e5"
              rx={3}
            />
            {i % labelEvery === 0 && (
              <text x={x} y={H + 16} textAnchor="middle" fontSize={10} fill="#a09880">
                {d.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DemoClientPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: rawPeriod } = await searchParams
  const periodKey: PeriodKey = (rawPeriod as PeriodKey) in PERIODS
    ? (rawPeriod as PeriodKey)
    : '30'
  const days = PERIODS[periodKey]

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: program } = await supabase
    .from('real_estate_programs')
    .select('id, name, status, location, budget_google, budget_meta, start_date, end_date')
    .eq('id', GALLIENI_ID)
    .single()

  if (!program) notFound()

  const budgetTotal = (Number(program.budget_google) || 0) + (Number(program.budget_meta) || 0)

  // All-time KPIs (indépendant de la période sélectionnée)
  const { data: allMetrics } = await supabase
    .from('daily_ad_metrics')
    .select('spend, platform_conversions')
    .eq('program_id', GALLIENI_ID)

  const totalSpend    = (allMetrics ?? []).reduce((s, r) => s + (Number(r.spend) || 0), 0)
  const totalContacts = (allMetrics ?? []).reduce((s, r) => s + (Number(r.platform_conversions) || 0), 0)
  const coutParContact = totalContacts > 0 ? totalSpend / totalContacts : null

  // Métriques graphique — filtrées sur la période choisie
  let chartQuery = supabase
    .from('daily_ad_metrics')
    .select('date, platform_conversions')
    .eq('program_id', GALLIENI_ID)
    .order('date', { ascending: true })

  if (days !== null) {
    chartQuery = chartQuery.gte('date', cutoffFromDays(days))
  }

  const { data: recentMetrics } = await chartQuery

  const byDay = new Map<string, number>()
  for (const m of recentMetrics ?? []) {
    byDay.set(m.date, (byDay.get(m.date) ?? 0) + (Number(m.platform_conversions) || 0))
  }
  const chartData = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, contacts]) => ({ label: fmtDateShort(date), contacts }))

  const isLive = program.status === 'live'

  const statusLabel = isLive ? 'En ligne'
    : program.status === 'paused'  ? 'En pause'
    : program.status === 'archived' ? 'Terminé'
    : 'En préparation'

  const statusClass = isLive
    ? 'bg-emerald-50 text-emerald-700'
    : program.status === 'paused'
    ? 'bg-amber-50 text-amber-700'
    : program.status === 'archived'
    ? 'bg-sand-100 text-sand-500'
    : 'bg-indigo-50 text-indigo-600'

  return (
    <div className="min-h-screen bg-sand-50">

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-sand-200 bg-white px-6 shadow-ds-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <span className="text-xs font-bold italic text-white">X</span>
          </div>
          <span className="font-semibold text-sand-900">XXL Communication</span>
          <span className="mx-1 text-sand-300">·</span>
          <span className="text-sm text-sand-500">Espace promoteur</span>
        </div>
        <span className="rounded-full bg-amber-50 border border-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">
          Aperçu démo
        </span>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">

        {/* ── Hero ── */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-sand-900">{program.name}</h1>
            {program.location && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-sand-500">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {program.location}
              </p>
            )}
          </div>
          <span className={`mt-1 rounded-full px-3 py-1 text-xs font-semibold border ${statusClass} border-transparent`}>
            {statusLabel}
          </span>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard
            icon={<Users className="h-4 w-4 text-indigo-600" />}
            bg="bg-indigo-50"
            label="Contacts reçus"
            value={totalContacts > 0 ? totalContacts.toLocaleString('fr-FR') : '–'}
          />
          <KpiCard
            icon={<Coins className="h-4 w-4 text-emerald-600" />}
            bg="bg-emerald-50"
            label="Coût par contact"
            value={coutParContact !== null ? fmtEur(coutParContact) : 'N/C'}
          />
          <KpiCard
            icon={<Wallet className="h-4 w-4 text-indigo-600" />}
            bg="bg-indigo-50"
            label="Budget engagé"
            value={totalSpend > 0 ? fmtEur(totalSpend) : '–'}
            sub={budgetTotal > 0 ? <BudgetBar spent={totalSpend} total={budgetTotal} /> : undefined}
          />
          <KpiCard
            icon={<Clock className="h-4 w-4 text-terra-500" />}
            bg="bg-sand-50"
            label="Jours restants"
            value={daysLeft(program.end_date)}
          />
        </div>

        {/* ── Graphique ── */}
        <div className="rounded-[10px] border border-sand-200 bg-white p-6 shadow-ds-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold text-sand-900">
              Contacts reçus
              <span className="ml-2 font-normal text-sand-400">
                {chartData.reduce((s, d) => s + d.contacts, 0).toLocaleString('fr-FR')} sur la période
              </span>
            </h2>
            <PeriodPicker current={periodKey} />
          </div>
          <BarChart data={chartData} />
        </div>

        {/* ── CTA PDF ── */}
        <div className="flex justify-end">
          <div className="group relative">
            <button
              disabled
              className="flex cursor-not-allowed items-center gap-2 rounded-ds-md border border-sand-200 bg-sand-50 px-5 py-2.5 text-[13px] font-medium text-sand-400"
            >
              <Download className="h-4 w-4" />
              Télécharger le bilan PDF
            </button>
            <div className="pointer-events-none absolute bottom-full right-0 mb-2 hidden w-48 rounded-lg bg-sand-900 px-3 py-2 text-center text-xs text-white group-hover:block">
              Bientôt disponible
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
