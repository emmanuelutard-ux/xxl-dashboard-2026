'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { ArrowRight, ExternalLink, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateProgramStatus, type ProgramStatus } from '@/app/actions/updateProgramStatus'

function fmtDate(iso: string): string {
  const s = iso.slice(0, 10).split('-')
  return `${s[2]}/${s[1]}/${s[0]}`
}

export interface KanbanProgram {
  id: string
  name: string
  location: string | null
  status: string
  budget_google: number | null
  budget_meta: number | null
  start_date: string | null
  end_date: string | null
  promoteur: string | null
  cpl_cible: number | null
  live_metrics: {
    spent: number
    leads: number
    cpl: number | null
    budget_pct: number | null
    time_pct: number | null
  } | null
}

interface Props {
  program: KanbanProgram
  nextStatus: ProgramStatus | null
  nextLabel: string | null
}

// Barre de progression compacte
function ProgressBar({ pct, colorCls }: { pct: number; colorCls: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100">
      <div
        className={cn('h-1.5 rounded-full transition-all', colorCls)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function KanbanCard({ program, nextStatus, nextLabel }: Props) {
  const [pending, startTransition] = useTransition()

  const budgetTotal =
    (Number(program.budget_google) || 0) + (Number(program.budget_meta) || 0)

  function handleAvancer() {
    if (!nextStatus) return
    startTransition(async () => {
      await updateProgramStatus(program.id, nextStatus)
    })
  }

  const m = program.live_metrics

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Nom + ville */}
      <div>
        <p className="font-semibold text-slate-900 leading-tight">{program.name}</p>
        {program.location && (
          <p className="mt-0.5 text-xs text-slate-500">{program.location}</p>
        )}
      </div>

      {/* Méta-données */}
      <dl className="space-y-1">
        {program.promoteur && (
          <div className="flex justify-between text-xs">
            <dt className="text-slate-400">Promoteur</dt>
            <dd className="font-medium text-slate-700">{program.promoteur}</dd>
          </div>
        )}
        {budgetTotal > 0 && (
          <div className="flex justify-between text-xs">
            <dt className="text-slate-400">Budget total</dt>
            <dd className="font-medium text-slate-700">{budgetTotal.toLocaleString('fr-FR')} €</dd>
          </div>
        )}
        {program.cpl_cible && (
          <div className="flex justify-between text-xs">
            <dt className="text-slate-400">CPL cible</dt>
            <dd className="font-medium text-green-700">{program.cpl_cible} €</dd>
          </div>
        )}
        {program.start_date && (
          <div className="flex justify-between text-xs">
            <dt className="text-slate-400">Lancement</dt>
            <dd className="font-medium text-slate-700">
              {fmtDate(program.start_date)}
            </dd>
          </div>
        )}
      </dl>

      {/* ── Indicateurs live ── */}
      {program.status === 'live' && (
        <div className="space-y-2.5 border-t border-slate-100 pt-2.5">

          {/* Temps écoulé */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Temps écoulé</span>
              <span className="font-medium text-slate-700">
                {m?.time_pct != null ? `${m.time_pct}%` : '–'}
              </span>
            </div>
            {m?.time_pct != null && (
              <ProgressBar pct={m.time_pct} colorCls="bg-slate-400" />
            )}
          </div>

          {/* Budget dépensé */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Budget dépensé</span>
              <span className={cn(
                'font-medium',
                m?.budget_pct != null && m.budget_pct > 80 ? 'text-red-600' :
                m?.budget_pct != null && m.budget_pct > 60 ? 'text-amber-600' : 'text-slate-700'
              )}>
                {m?.budget_pct != null
                  ? `${m.budget_pct}% · ${m.spent.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`
                  : '–'}
              </span>
            </div>
            {m?.budget_pct != null && (
              <ProgressBar
                pct={m.budget_pct}
                colorCls={
                  m.budget_pct > 80 ? 'bg-red-500' :
                  m.budget_pct > 60 ? 'bg-amber-400' : 'bg-blue-500'
                }
              />
            )}
          </div>

          {/* CPL actuel */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">CPL actuel</span>
            <span className={cn(
              'font-medium',
              m?.cpl != null && program.cpl_cible && m.cpl > program.cpl_cible
                ? 'text-red-600'
                : 'text-slate-700'
            )}>
              {m?.cpl != null
                ? `${m.cpl.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                : m?.leads === 0 ? `0 contact` : '–'}
            </span>
          </div>

        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Link
          href={`/agency/programs/${program.id}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ouvrir
        </Link>

        {nextStatus && nextLabel && (
          <button
            type="button"
            disabled={pending}
            onClick={handleAvancer}
            className={cn(
              'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
              pending
                ? 'bg-slate-100 text-slate-400'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="h-3.5 w-3.5" />
            )}
            {pending ? '...' : nextLabel}
          </button>
        )}
      </div>
    </div>
  )
}
