// ⚠️ DEMO MODE - DO NOT MERGE TO MAIN
// Page de démonstration sans authentification — Résidence Galliéni
// Utilise le service role key pour contourner les RLS.
// Brancher via demo/client-no-auth uniquement.

import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import { MapPin, Users, Coins, Wallet, Clock, Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

// ID fixe de Résidence Galliéni (Foncière Siba — Nanterre)
const GALLIENI_ID = 'b7b49362-9899-4bec-a553-0a2f90ad8ea0'

function fmtEur(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}

function daysLeft(endDate: string | null): string {
  if (!endDate) return 'N/C'
  const diff = Math.ceil(
    (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (diff < 0) return 'Terminé'
  if (diff === 0) return "Aujourd'hui"
  return `${diff} jour${diff > 1 ? 's' : ''}`
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function fmtDateShort(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function KpiCard({
  icon, bg, label, value, sub,
}: {
  icon: React.ReactNode; bg: string; label: string; value: string; sub?: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${bg}`}>{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  )
}

function BudgetBar({ spent, total }: { spent: number; total: number }) {
  const pct = total > 0 ? Math.min((spent / total) * 100, 100) : 0
  return (
    <div className="mt-2">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-400">
        sur {fmtEur(total)} de budget total ({Math.round(pct)} %)
      </p>
    </div>
  )
}

// Graphique SVG inline — pas de dépendance recharts pour éviter les erreurs
// d'hydratation sur une page statiquement rendue sans session.
function SimpleBarChart({ data }: { data: { label: string; contacts: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        Aucune donnée sur les 30 derniers jours
      </div>
    )
  }

  const max = Math.max(...data.map(d => d.contacts), 1)
  const W = 600
  const H = 180
  const barW = Math.max(4, Math.min(20, (W / data.length) - 4))
  const step = W / data.length

  // Only label every ~6th point to avoid crowding
  const labelEvery = Math.max(1, Math.floor(data.length / 6))

  return (
    <svg viewBox={`0 0 ${W} ${H + 24}`} className="w-full" aria-hidden="true">
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
              fill="#3b82f6"
              rx={3}
            />
            {i % labelEvery === 0 && (
              <text
                x={x}
                y={H + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#94a3b8"
              >
                {d.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default async function DemoClientPage() {
  // Service role bypasse les RLS — lecture directe sans session
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

  const { data: allMetrics } = await supabase
    .from('daily_ad_metrics')
    .select('spend, platform_conversions')
    .eq('program_id', GALLIENI_ID)

  const totalSpend    = (allMetrics ?? []).reduce((s, r) => s + (Number(r.spend) || 0), 0)
  const totalContacts = (allMetrics ?? []).reduce((s, r) => s + (Number(r.platform_conversions) || 0), 0)
  const coutParContact = totalContacts > 0 ? totalSpend / totalContacts : null

  const cutoff = daysAgo(30)
  const { data: recentMetrics } = await supabase
    .from('daily_ad_metrics')
    .select('date, platform_conversions')
    .eq('program_id', GALLIENI_ID)
    .gte('date', cutoff)
    .order('date', { ascending: true })

  const byDay = new Map<string, number>()
  for (const m of recentMetrics ?? []) {
    byDay.set(m.date, (byDay.get(m.date) ?? 0) + (Number(m.platform_conversions) || 0))
  }
  const chartData = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, contacts]) => ({ label: fmtDateShort(date), contacts }))

  const isLive = program.status === 'live'

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Header démo */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <span className="text-xs font-bold italic text-white">X</span>
          </div>
          <span className="font-bold text-slate-800">XXL Communication</span>
          <span className="mx-1 text-slate-300">·</span>
          <span className="text-sm text-slate-500">Espace promoteur</span>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">
          Aperçu démo
        </span>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-8">

        {/* Hero */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{program.name}</h1>
            {program.location && (
              <p className="mt-1 flex items-center gap-1.5 text-slate-500">
                <MapPin className="h-4 w-4 shrink-0" />
                {program.location}
              </p>
            )}
          </div>
          <span className={`mt-1 rounded-full px-3 py-1 text-sm font-semibold ${
            isLive ? 'bg-green-100 text-green-700'
              : program.status === 'paused' ? 'bg-amber-100 text-amber-700'
              : program.status === 'archived' ? 'bg-slate-100 text-slate-500'
              : 'bg-indigo-50 text-indigo-600'
          }`}>
            {isLive ? 'En ligne'
              : program.status === 'paused' ? 'En pause'
              : program.status === 'archived' ? 'Terminé'
              : 'En préparation'}
          </span>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard
            icon={<Users className="h-5 w-5 text-blue-600" />}
            bg="bg-blue-50"
            label="Contacts reçus"
            value={totalContacts > 0 ? String(totalContacts) : '–'}
          />
          <KpiCard
            icon={<Coins className="h-5 w-5 text-emerald-600" />}
            bg="bg-emerald-50"
            label="Coût par contact"
            value={coutParContact !== null ? fmtEur(coutParContact) : 'N/C'}
          />
          <KpiCard
            icon={<Wallet className="h-5 w-5 text-indigo-600" />}
            bg="bg-indigo-50"
            label="Budget engagé"
            value={totalSpend > 0 ? fmtEur(totalSpend) : '–'}
            sub={budgetTotal > 0 ? <BudgetBar spent={totalSpend} total={budgetTotal} /> : undefined}
          />
          <KpiCard
            icon={<Clock className="h-5 w-5 text-amber-600" />}
            bg="bg-amber-50"
            label="Jours restants"
            value={daysLeft(program.end_date)}
          />
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-slate-800">
            Évolution de votre campagne
            <span className="ml-2 text-xs font-normal text-slate-400">30 derniers jours</span>
          </h2>
          <SimpleBarChart data={chartData} />
        </div>

        {/* CTA PDF */}
        <div className="flex justify-end">
          <div className="group relative">
            <button
              disabled
              className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-400"
            >
              <Download className="h-4 w-4" />
              Télécharger le bilan PDF
            </button>
            <div className="pointer-events-none absolute bottom-full right-0 mb-2 hidden w-48 rounded-lg bg-slate-800 px-3 py-2 text-center text-xs text-white group-hover:block">
              Bientôt disponible
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
