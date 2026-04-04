import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { ProgramStatus } from '@/app/actions/updateProgramStatus'
import type { MediaPlan } from '@/app/actions/generateMediaPlan'
import KanbanCard, { type KanbanProgram } from './KanbanCard'

export const dynamic = 'force-dynamic'

// ─── Config des colonnes ──────────────────────────────────────────────────────

interface Column {
  id: ProgramStatus
  label: string
  headerCls: string
  dotCls: string
  next: ProgramStatus | null
  nextLabel: string | null
}

const COLUMNS: Column[] = [
  {
    id: 'brief',
    label: 'Brief en cours',
    headerCls: 'bg-slate-100 border-slate-200',
    dotCls: 'bg-slate-400',
    next: 'validated',
    nextLabel: 'Plan validé',
  },
  {
    id: 'validated',
    label: 'Plan validé',
    headerCls: 'bg-blue-50 border-blue-200',
    dotCls: 'bg-blue-500',
    next: 'active',
    nextLabel: 'Assets en cours',
  },
  {
    id: 'active',
    label: 'Assets en cours',
    headerCls: 'bg-amber-50 border-amber-200',
    dotCls: 'bg-amber-500',
    next: 'live',
    nextLabel: 'Campagne active',
  },
  {
    id: 'live',
    label: 'Campagne active',
    headerCls: 'bg-green-50 border-green-200',
    dotCls: 'bg-green-500',
    next: 'archived',
    nextLabel: 'Terminé',
  },
  {
    id: 'archived',
    label: 'Terminé',
    headerCls: 'bg-slate-100 border-slate-200',
    dotCls: 'bg-slate-300',
    next: null,
    nextLabel: null,
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  // Contrôle d'accès : expert ou agency uniquement
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // En développement, on bypasse le contrôle de rôle
  if (process.env.NODE_ENV !== 'development') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // Bloquer uniquement les clients explicites — si aucun profil trouvé, on laisse passer
    if (profile?.role === 'client') {
      redirect('/agency/media-room')
    }
  }

  // Récupération des programmes
  const { data: programs, error } = await supabase
    .from('real_estate_programs')
    .select('id, name, location, status, budget_google, budget_meta, start_date, end_date, brief_data, ai_media_plan')
    .order('created_at', { ascending: false })

  if (error || !programs) {
    return <div className="p-8 text-red-500">Erreur chargement : {error?.message}</div>
  }

  // Métriques des programmes live (dépenses + contacts depuis daily_ad_metrics)
  const liveIds = programs.filter((p) => p.status === 'live').map((p) => p.id)
  const metricsMap: Record<string, { spent: number; leads: number }> = {}

  if (liveIds.length > 0) {
    const { data: metrics } = await supabase
      .from('daily_ad_metrics')
      .select('program_id, spend, platform_conversions')
      .in('program_id', liveIds)

    for (const m of metrics ?? []) {
      if (!metricsMap[m.program_id]) metricsMap[m.program_id] = { spent: 0, leads: 0 }
      metricsMap[m.program_id].spent += Number(m.spend) || 0
      metricsMap[m.program_id].leads += Number(m.platform_conversions) || 0
    }
  }

  // Transformation en KanbanProgram
  const kanbanPrograms: KanbanProgram[] = programs.map((p) => {
    const brief = p.brief_data as Record<string, unknown> | null
    const plan = p.ai_media_plan as MediaPlan | null
    const budgetTotal = (Number(p.budget_google) || 0) + (Number(p.budget_meta) || 0)

    // Indicateurs live
    let liveMetrics: KanbanProgram['live_metrics'] = null
    if (p.status === 'live') {
      const raw = metricsMap[p.id] ?? { spent: 0, leads: 0 }

      // Temps écoulé en %
      let timePct: number | null = null
      if (p.start_date && p.end_date) {
        const start = new Date(p.start_date).getTime()
        const end = new Date(p.end_date).getTime()
        const now = Date.now()
        if (end > start) {
          timePct = Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
        }
      }

      liveMetrics = {
        spent: raw.spent,
        leads: raw.leads,
        cpl: raw.leads > 0 ? Math.round((raw.spent / raw.leads) * 100) / 100 : null,
        budget_pct: budgetTotal > 0 ? Math.min(100, Math.round((raw.spent / budgetTotal) * 100)) : null,
        time_pct: timePct,
      }
    }

    return {
      id: p.id,
      name: p.name,
      location: p.location ?? null,
      status: p.status,
      budget_google: Number(p.budget_google) || null,
      budget_meta: Number(p.budget_meta) || null,
      start_date: p.start_date ?? null,
      end_date: p.end_date ?? null,
      promoteur: brief?.promoteur ? String(brief.promoteur) : null,
      cpl_cible: plan?.cpl_cible ?? null,
      live_metrics: liveMetrics,
    }
  })

  // Groupement par statut
  const byStatus = (status: string) => kanbanPrograms.filter((p) => p.status === status)

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* En-tête page */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-slate-900">Pipeline programmes</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          {programs.length} programme{programs.length > 1 ? 's' : ''} au total
        </p>
      </div>

      {/* Kanban */}
      <div className="flex flex-1 gap-4 overflow-x-auto overflow-y-hidden p-4">
        {COLUMNS.map((col) => {
          const colPrograms = byStatus(col.id)
          return (
            <div
              key={col.id}
              className="flex w-72 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
            >
              {/* En-tête colonne */}
              <div className={`flex items-center justify-between border-b px-4 py-3 ${col.headerCls}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dotCls}`} />
                  <span className="text-sm font-semibold text-slate-800">{col.label}</span>
                </div>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-slate-500">
                  {colPrograms.length}
                </span>
              </div>

              {/* Cartes — scrollables verticalement */}
              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {colPrograms.length === 0 ? (
                  <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-slate-200">
                    <span className="text-xs text-slate-400">Aucun programme</span>
                  </div>
                ) : (
                  colPrograms.map((program) => (
                    <KanbanCard
                      key={program.id}
                      program={program}
                      nextStatus={col.next}
                      nextLabel={col.nextLabel}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
