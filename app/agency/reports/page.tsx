// Bilans clients — liste des programmes éligibles à un bilan de performance.
// Aucune table `reports` n'existe encore : on liste les programmes ayant
// effectivement diffusé (live / paused / archived) avec un statut "À générer"
// en attendant l'implémentation Sprint 4 (Google Slides automatisés).

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, FileText } from 'lucide-react'
import { Tag } from '@/components/ds/Tag'

export const dynamic = 'force-dynamic'

const ELIGIBLE_STATUSES = ['live', 'paused', 'archived'] as const

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

export default async function ReportsPage() {
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

  const { data: programs, error } = await supabase
    .from('real_estate_programs')
    .select('id, name, location, status, budget_google, budget_meta, start_date, end_date, brief_data')
    .in('status', ELIGIBLE_STATUSES as unknown as string[])
    .order('end_date', { ascending: false, nullsFirst: false })

  if (error) {
    return (
      <div className="p-8 text-rose-500 text-[13px]">
        Erreur chargement : {error.message}
      </div>
    )
  }

  const reports = (programs ?? []).map(p => {
    const brief = (p.brief_data ?? null) as Record<string, unknown> | null
    const hasGoogle = Number(p.budget_google) > 0
    const hasMeta   = Number(p.budget_meta)   > 0
    const channels: string[] = []
    if (hasGoogle) channels.push('Google')
    if (hasMeta)   channels.push('Meta')
    return {
      id:        p.id as string,
      name:      p.name as string,
      location:  p.location as string | null,
      promoteur: brief?.promoteur ? String(brief.promoteur) : null,
      status:    p.status as string,
      start:     p.start_date as string | null,
      end:       p.end_date as string | null,
      channels,
    }
  })

  return (
    <div className="flex flex-col h-full">

      {/* ── TopBar ── */}
      <header className="flex items-center justify-between pl-14 pr-4 md:px-6 py-3.5 border-b border-sand-200 bg-white shrink-0">
        <div>
          <div className="text-xs text-sand-500 mb-0.5">Bilans clients</div>
          <div className="text-lg font-semibold text-sand-900">
            {reports.length} programme{reports.length !== 1 ? 's' : ''} éligible{reports.length !== 1 ? 's' : ''}
          </div>
        </div>
      </header>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-6xl mx-auto">

          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 rounded-[10px] border border-dashed border-sand-200 bg-white text-center">
              <FileText className="mb-3 h-8 w-8 text-sand-300" />
              <p className="text-[13px] font-medium text-sand-600">Aucun bilan disponible</p>
              <p className="mt-1 text-[12px] text-sand-400">
                Les programmes ayant diffusé apparaîtront ici dès la mise en ligne des campagnes.
              </p>
            </div>
          ) : (
            <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-sand-100 bg-sand-50">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Programme</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Période</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Canaux</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Statut</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-sand-500 tracking-[0.04em]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {reports.map(r => (
                    <tr
                      key={r.id}
                      className="group hover:bg-sand-50 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <Link href={`/agency/programs/${r.id}`} className="block">
                          <p className="font-semibold text-sand-900 group-hover:text-indigo-700 transition-colors leading-tight">
                            {r.name}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] text-sand-500">
                            {r.promoteur && <span>{r.promoteur}</span>}
                            {r.promoteur && r.location && <span>·</span>}
                            {r.location && <span>{r.location}</span>}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-sand-700">
                        <Link href={`/agency/programs/${r.id}`} className="block">
                          {r.start && r.end
                            ? `${fmtDateShort(r.start)} → ${fmtDateYear(r.end)}`
                            : <span className="text-sand-400">—</span>
                          }
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/agency/programs/${r.id}`} className="block">
                          <div className="flex flex-wrap items-center gap-1">
                            {r.channels.length === 0 ? (
                              <span className="text-sand-400">—</span>
                            ) : (
                              r.channels.map(c => (
                                <Tag key={c} variant="default">{c}</Tag>
                              ))
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/agency/programs/${r.id}`} className="block">
                          <Tag variant="amber">À générer</Tag>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/agency/programs/${r.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Ouvrir
                          <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}
