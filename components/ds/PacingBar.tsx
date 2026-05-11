export type PacingStatus = 'on-track' | 'under' | 'over'

const statusFillClass: Record<PacingStatus, string> = {
  'on-track': 'bg-emerald-500',
  'under':    'bg-amber-500',
  'over':     'bg-rose-500',
}

const statusTextClass: Record<PacingStatus, string> = {
  'on-track': 'text-emerald-700',
  'under':    'text-amber-700',
  'over':     'text-rose-700',
}

type Props = {
  timePct:   number
  budgetPct: number
  status?:   PacingStatus
}

export function PacingBar({ timePct, budgetPct, status = 'on-track' }: Props) {
  const clampedTime   = Math.min(100, Math.max(0, timePct))
  const clampedBudget = Math.min(100, Math.max(0, budgetPct))

  return (
    <div className="flex flex-col gap-1">
      <div className={`flex justify-between font-mono text-[10.5px] text-sand-500`}>
        <span>Temps · {clampedTime}%</span>
        <span className={statusTextClass[status]}>Budget · {clampedBudget}%</span>
      </div>
      <div className="relative h-1.5 bg-sand-100 rounded-ds-full overflow-visible">
        {/* Budget fill */}
        <div
          className={`absolute left-0 top-0 h-full rounded-ds-full ${statusFillClass[status]}`}
          style={{ width: `${clampedBudget}%` }}
        />
        {/* Time marker */}
        <div
          className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-sand-700"
          style={{ left: `${clampedTime}%` }}
        />
      </div>
    </div>
  )
}

export default PacingBar
