import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createUserClient } from '@/lib/supabase/client-user'
import { MapPin, ChevronRight, Users } from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  brief:     'En préparation',
  validated: 'Plan validé',
  active:    'Assets en cours',
  live:      'En ligne',
  paused:    'En pause',
  archived:  'Terminé',
}

export default async function ClientProgramsPage() {
  const supabase = await createUserClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/client/login')

  const { data: programs } = await supabase
    .from('real_estate_programs')
    .select('id, name, status, location, start_date, end_date')
    .order('created_at', { ascending: false })

  if (!programs || programs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Users className="mb-3 h-10 w-10 text-slate-300" />
        <p className="font-medium text-slate-600">Aucun programme ne vous est encore associé.</p>
        <p className="mt-1 text-sm text-slate-400">Contactez votre agence.</p>
      </div>
    )
  }

  if (programs.length === 1) {
    redirect(`/client/${programs[0].id}`)
  }

  const ids = programs.map(p => p.id)
  const { data: metrics } = await supabase
    .from('daily_ad_metrics')
    .select('program_id, platform_conversions')
    .in('program_id', ids)

  const contactsByProgram: Record<string, number> = {}
  for (const m of metrics ?? []) {
    const prev = contactsByProgram[m.program_id] ?? 0
    contactsByProgram[m.program_id] = prev + (Number(m.platform_conversions) || 0)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mes programmes</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sélectionnez un programme pour accéder à son tableau de bord.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {programs.map(p => {
          const contacts = contactsByProgram[p.id] ?? 0
          return (
            <Link
              key={p.id}
              href={`/client/${p.id}`}
              className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold text-slate-900 transition-colors group-hover:text-blue-700">
                  {p.name}
                </h2>
                <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition-colors group-hover:text-blue-500" />
              </div>

              {p.location && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {p.location}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    p.status === 'live'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {STATUS_LABELS[p.status] ?? p.status}
                </span>
                <span className="text-sm font-semibold text-slate-700">
                  {contacts} contact{contacts !== 1 ? 's' : ''}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
