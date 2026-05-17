// Pipeline kanban refondu — mockup 3.6 (Claude Design audit)
//
// Mapping status BDD → colonnes :
//   brief      → "Brief"           (programme créé, brief en cours)
//   validated  → "Plan validé"     (plan média IA validé)
//   active     → "Assets en cours" (créatifs en préparation)
//   live       → "Campagne active" (campagnes publicitaires actives)
//   paused     → "Campagne active" (campagne pausée — reste visible dans la colonne live)
//   archived   → "Bilan"           (programme terminé)
//
// Drag-and-drop : TODO — @dnd-kit/sortable absent des dépendances.
// Intégrer dans une PR dédiée : installer @dnd-kit/core @dnd-kit/sortable,
// wrapper chaque colonne en <SortableContext> et chaque carte en <DraggableCard>.
// L'action Server existante updateProgramStatus() gère déjà l'update BDD.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PipelineCard } from '@/components/PipelineCard'
import type { PipelineCardProps } from '@/components/PipelineCard'

export const dynamic = 'force-dynamic'

// ── Colonnes du kanban ─────────────────────────────────────────────────────────

const COLUMNS = [
  {
    id:       'brief',
    label:    'Brief',
    dot:      'bg-sand-400',
    statuses: ['brief'] as string[],
  },
  {
    id:       'validated',
    label:    'Plan validé',
    dot:      'bg-indigo-500',
    statuses: ['validated'] as string[],
  },
  {
    id:       'active',
    label:    'Assets en cours',
    dot:      'bg-amber-500',
    statuses: ['active'] as string[],
  },
  {
    id:       'live',
    label:    'Campagne active',
    dot:      'bg-emerald-500',
    statuses: ['live', 'paused'] as string[],
  },
  {
    id:       'archived',
    label:    'Bilan',
    dot:      'bg-terra-500',
    statuses: ['archived'] as string[],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function sinceLabel(createdAt: string): string {
  const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
  if (days === 0) return "aujourd'hui"
  if (days === 1) return 'il y a 1j'
  return `il y a ${days}j`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PipelinePage() {
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
    .select('id, name, location, status, budget_google, budget_meta, start_date, end_date, brief_data, target_cpl, created_at')
    .order('created_at', { ascending: false })

  if (error || !programs) {
    return <div className="p-8 text-rose-500">Erreur chargement : {error?.message}</div>
  }

  // ── Métriques pour les programmes actifs ──────────────────────────────────
  const activeIds = programs
    .filter(p => p.status === 'live' || p.status === 'paused')
    .map(p => p.id)

  const metricsMap: Record<string, { spent: number; contacts: number }> = {}

  if (activeIds.length > 0) {
    const { data: metrics } = await supabase
      .from('daily_ad_metrics')
      .select('program_id, spend, platform_conversions')
      .in('program_id', activeIds)

    for (const m of metrics ?? []) {
      if (!metricsMap[m.program_id]) metricsMap[m.program_id] = { spent: 0, contacts: 0 }
      metricsMap[m.program_id].spent    += Number(m.spend) || 0
      metricsMap[m.program_id].contacts += Number(m.platform_conversions) || 0
    }
  }

  // ── Transformer en PipelineCardProps ────────────────────────────────────────
  const cardsByStatus: Record<string, PipelineCardProps[]> = {}

  for (const p of programs) {
    const brief       = p.brief_data as Record<string, unknown> | null
    const promoteur   = brief?.promoteur ? String(brief.promoteur) : (p.location ?? null)
    const budgetTotal = (Number(p.budget_google) || 0) + (Number(p.budget_meta) || 0)
    const targetCpl   = Number(p.target_cpl) > 0 ? Number(p.target_cpl) : 30

    let cpl: number | null      = null
    let cplTone: 'good' | 'bad' | null = null
    let alertPacing: string | null     = null

    if (p.status === 'live' || p.status === 'paused') {
      const m = metricsMap[p.id] ?? { spent: 0, contacts: 0 }
      cpl = m.contacts > 0 ? m.spent / m.contacts : null
      if (cpl !== null) cplTone = cpl <= targetCpl * 1.1 ? 'good' : 'bad'

      // Alerte sous-consommation : temps écoulé > budget consommé + 20 pts
      if (p.start_date && p.end_date && budgetTotal > 0) {
        const start = new Date(p.start_date as string).getTime()
        const end   = new Date(p.end_date   as string).getTime()
        const now   = Date.now()
        if (end > start && now > start) {
          const timePct   = Math.round(Math.min(100, ((now - start) / (end - start)) * 100))
          const budgetPct = Math.round(Math.min(100, (m.spent / budgetTotal) * 100))
          const gap = timePct - budgetPct
          if (gap > 20) alertPacing = `Sous-conso ${gap} pts`
        }
      }
    }

    // Alerte visuel HD manquant : mocké pour les programmes "active"
    // sans champ brief_data.visuel_hd. À remplacer par une vraie colonne
    // creative_assets_ready lorsque le champ sera ajouté au schéma.
    const alertAsset = p.status === 'active' && !brief?.visuel_hd

    const card: PipelineCardProps = {
      id:          p.id as string,
      name:        p.name as string,
      promoteur,
      cpl,
      cplTone,
      alertPacing,
      alertAsset,
      since:       sinceLabel(p.created_at as string),
    }

    const key = p.status as string
    if (!cardsByStatus[key]) cardsByStatus[key] = []
    cardsByStatus[key].push(card)
  }

  // Compteur "en cours" = tout sauf archived
  const totalActive = programs.filter(p => p.status !== 'archived').length

  return (
    <div className="flex flex-col h-full">

      {/* ── TopBar ── */}
      <header className="flex items-center justify-between pl-14 pr-4 md:px-6 py-3.5 border-b border-sand-200 bg-white shrink-0">
        <div>
          <div className="text-xs text-sand-500 mb-0.5">Pipeline</div>
          <div className="text-lg font-semibold text-sand-900">
            {totalActive} programme{totalActive !== 1 ? 's' : ''} en cours
          </div>
        </div>
        <Link
          href="/agency/briefs/nouveau"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-ds-md bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          + Nouveau brief
        </Link>
      </header>

      {/* ── Kanban — scroll horizontal si écran étroit ── */}
      <div className="flex-1 overflow-auto p-5">
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(5, minmax(280px, 320px))' }}
        >
          {COLUMNS.map(col => {
            const cards = col.statuses.flatMap(s => cardsByStatus[s] ?? [])
            return (
              <div key={col.id} className="flex flex-col gap-2">

                {/* Header colonne */}
                <div className="flex items-center gap-2 px-1 mb-1">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                  <span className="text-[12px] font-semibold text-sand-800 leading-none">
                    {col.label}
                  </span>
                  <span className="text-[11px] text-sand-400 leading-none">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col gap-2 min-h-[100px]">
                  {cards.length === 0 ? (
                    <div className="h-16 border border-dashed border-sand-200 rounded-[10px] grid place-items-center">
                      <span className="text-[11px] text-sand-400">—</span>
                    </div>
                  ) : (
                    cards.map(card => (
                      <PipelineCard key={card.id} {...card} />
                    ))
                  )}
                </div>

              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
