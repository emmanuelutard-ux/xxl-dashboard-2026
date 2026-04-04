'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { MediaPlanChecklist } from '@/app/actions/generateMediaPlan'

function prioriteBadge(p: MediaPlanChecklist['priorite']) {
  const map = {
    haute:   'bg-red-100 text-red-700',
    moyenne: 'bg-amber-100 text-amber-700',
    basse:   'bg-slate-100 text-slate-500',
  }
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', map[p])}>
      {p}
    </span>
  )
}

function responsableBadge(r: MediaPlanChecklist['responsable']) {
  const map = {
    expert:   'bg-blue-100 text-blue-700',
    agence:   'bg-purple-100 text-purple-700',
    diffusez: 'bg-teal-100 text-teal-700',
  }
  return (
    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', map[r])}>
      {r}
    </span>
  )
}

interface Props {
  checklist: MediaPlanChecklist[]
}

export default function PlanChecklistClient({ checklist }: Props) {
  const [checked, setChecked] = useState<Record<number, boolean>>({})

  const doneCount = Object.values(checked).filter(Boolean).length

  function toggle(i: number) {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  return (
    <div className="space-y-3">
      {/* Barre de progression */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-green-500 transition-all duration-300"
            style={{ width: `${checklist.length ? (doneCount / checklist.length) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 tabular-nums">
          {doneCount}/{checklist.length}
        </span>
      </div>

      {/* En-têtes colonnes */}
      <div className="grid grid-cols-[1fr_80px_90px] gap-3 px-4 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tâche</span>
        <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Priorité</span>
        <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">Responsable</span>
      </div>

      {/* Lignes */}
      {checklist.map((task, i) => (
        <button
          key={i}
          type="button"
          onClick={() => toggle(i)}
          className={cn(
            'grid w-full grid-cols-[1fr_80px_90px] items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors',
            checked[i]
              ? 'border-green-200 bg-green-50'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          )}
        >
          {/* Colonne Tâche : checkbox + titre + description */}
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={cn(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors',
                checked[i] ? 'border-green-500 bg-green-500' : 'border-slate-300 bg-white'
              )}
            >
              {checked[i] && (
                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 10 8">
                  <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <p className={cn('text-sm font-medium', checked[i] ? 'text-slate-400 line-through' : 'text-slate-900')}>
                {task.titre}
              </p>
              <p className={cn('mt-0.5 text-xs', checked[i] ? 'text-slate-300' : 'text-slate-500')}>
                {task.description}
              </p>
            </div>
          </div>

          {/* Colonne Priorité */}
          <div className="flex justify-center">
            {prioriteBadge(task.priorite)}
          </div>

          {/* Colonne Responsable */}
          <div className="flex justify-center">
            {responsableBadge(task.responsable)}
          </div>
        </button>
      ))}
    </div>
  )
}
