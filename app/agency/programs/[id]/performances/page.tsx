import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PerformancesClient, { type DailyMetric, type ProgramMeta } from './PerformancesClient'

export const dynamic = 'force-dynamic'

export default async function PerformancesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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

  // Contrôle d'accès
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (process.env.NODE_ENV !== 'development') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role === 'client') redirect('/agency/media-room')
  }

  // Programme
  const { data: program, error: progError } = await supabase
    .from('real_estate_programs')
    .select('id, name, location, budget_google, budget_meta, start_date, end_date')
    .eq('id', id)
    .single()

  if (progError || !program) notFound()

  // Toutes les métriques — triées par date décroissante
  const { data: rawMetrics } = await supabase
    .from('daily_ad_metrics')
    .select('date, platform, spend, clicks, impressions, platform_conversions')
    .eq('program_id', id)
    .order('date', { ascending: false })

  const metrics: DailyMetric[] = (rawMetrics ?? []).map((r) => ({
    date:                  r.date ?? '',
    platform:              r.platform ?? '',
    spend:                 Number(r.spend) || 0,
    clicks:                Number(r.clicks) || 0,
    impressions:           Number(r.impressions) || 0,
    platform_conversions:  Number(r.platform_conversions) || 0,
  }))

  const programMeta: ProgramMeta = {
    budget_google: Number(program.budget_google) || 0,
    budget_meta:   Number(program.budget_meta) || 0,
  }

  // ── Budget consommé ───────────────────────────────────────────────────────
  const budgetTotal = programMeta.budget_google + programMeta.budget_meta
  const totalSpend  = metrics.reduce((s, m) => s + m.spend, 0)
  const consumed    = budgetTotal > 0 ? Math.round((totalSpend / budgetTotal) * 100) : null

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* En-tête (server-rendered) */}
        <div>
          <Link
            href={`/agency/programs/${id}`}
            className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour au plan média
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{program.name}</h1>
              {program.location && (
                <p className="mt-1 text-sm text-slate-500">{program.location}</p>
              )}
            </div>
            {consumed !== null && (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
                <span className="text-slate-500">Budget consommé : </span>
                <span className="font-bold text-slate-900">{consumed}%</span>
                <span className="ml-2 text-xs text-slate-400">
                  ({Math.round(totalSpend).toLocaleString('fr-FR')} € / {budgetTotal.toLocaleString('fr-FR')} €)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Partie interactive */}
        <PerformancesClient programId={id} program={programMeta} metrics={metrics} />

      </div>
    </div>
  )
}
