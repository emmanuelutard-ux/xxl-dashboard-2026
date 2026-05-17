// Briefs en attente — programmes au statut `brief` (cycle CLAUDE.md §8).
// Lecture seule : agence et expert voient la file d'attente avant validation
// du plan média par le client.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight, Inbox } from 'lucide-react'
import { Tag } from '@/components/ds/Tag'

export const dynamic = 'force-dynamic'

function fmtDateYear(iso: string | null): string {
  if (!iso) return '—'
  const d = iso.split('T')[0]
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y.slice(2)}`
}

export default async function BriefsPage() {
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
    .select('id, name, location, status, brief_data, brief_completed_at, created_at')
    .eq('status', 'brief')
    .order('brief_completed_at', { ascending: false, nullsFirst: false })

  if (error) {
    return (
      <div className="p-8 text-rose-500 text-[13px]">
        Erreur chargement : {error.message}
      </div>
    )
  }

  const briefs = (programs ?? []).map(p => {
    const brief = (p.brief_data ?? null) as Record<string, unknown> | null
    return {
      id:        p.id as string,
      name:      p.name as string,
      location:  p.location as string | null,
      promoteur: brief?.promoteur ? String(brief.promoteur) : null,
      received:  (p.brief_completed_at as string | null) ?? (p.created_at as string | null),
    }
  })

  return (
    <div className="flex flex-col h-full">

      {/* ── TopBar ── */}
      <header className="flex items-center justify-between pl-14 pr-4 md:px-6 py-3.5 border-b border-sand-200 bg-white shrink-0">
        <div>
          <div className="text-xs text-sand-500 mb-0.5">Briefs en attente</div>
          <div className="text-lg font-semibold text-sand-900">
            {briefs.length} brief{briefs.length !== 1 ? 's' : ''} à traiter
          </div>
        </div>
        <Link
          href="/agency/briefs/nouveau"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-ds-md bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 transition-colors whitespace-nowrap"
        >
          + Nouveau brief
        </Link>
      </header>

      {/* ── Contenu ── */}
      <div className="flex-1 overflow-auto p-5">
        <div className="max-w-6xl mx-auto">

          {briefs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 rounded-[10px] border border-dashed border-sand-200 bg-white text-center">
              <Inbox className="mb-3 h-8 w-8 text-sand-300" />
              <p className="text-[13px] font-medium text-sand-600">Aucun brief en attente</p>
              <p className="mt-1 text-[12px] text-sand-400">
                Les nouveaux briefs apparaîtront ici tant qu&apos;ils ne sont pas validés.
              </p>
              <Link
                href="/agency/briefs/nouveau"
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-ds-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                + Nouveau brief
              </Link>
            </div>
          ) : (
            <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-sand-100 bg-sand-50">
                    <th className="px-5 py-3 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Programme</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Promoteur</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Ville</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Reçu le</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Statut</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-sand-500 tracking-[0.04em]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {briefs.map(b => (
                    <tr
                      key={b.id}
                      className="group hover:bg-sand-50 transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5">
                        <Link href={`/agency/programs/${b.id}`} className="block">
                          <p className="font-semibold text-sand-900 group-hover:text-indigo-700 transition-colors leading-tight">
                            {b.name}
                          </p>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-sand-700">
                        <Link href={`/agency/programs/${b.id}`} className="block">
                          {b.promoteur ?? <span className="text-sand-400">—</span>}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-sand-700">
                        <Link href={`/agency/programs/${b.id}`} className="block">
                          {b.location ?? <span className="text-sand-400">—</span>}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 tabular-nums text-sand-700">
                        <Link href={`/agency/programs/${b.id}`} className="block">
                          {fmtDateYear(b.received)}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link href={`/agency/programs/${b.id}`} className="block">
                          <Tag variant="default">Brief en cours</Tag>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          href={`/agency/programs/${b.id}`}
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
