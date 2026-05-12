import { Check } from 'lucide-react'

export default function StepBar({ current, steps }: { current: number; steps: string[] }) {
  return (
    <nav className="flex items-center" aria-label="Étapes du brief">
      {steps.map((label, i) => {
        const n        = i + 1
        const isDone   = n < current
        const isActive = n === current

        return (
          <div key={n} className={['flex items-center', i < steps.length - 1 ? 'flex-1' : ''].join(' ')}>
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={[
                  'h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors shrink-0',
                  isDone   ? 'bg-emerald-500 text-white' :
                  isActive ? 'bg-indigo-600 text-white'  :
                             'bg-sand-100 text-sand-400',
                ].join(' ')}
                aria-current={isActive ? 'step' : undefined}
              >
                {isDone ? <Check className="h-3 w-3" strokeWidth={2.5} /> : n}
              </div>
              <span
                className={[
                  'text-[12px] font-medium whitespace-nowrap',
                  isActive ? 'text-indigo-700' :
                  isDone   ? 'text-sand-600'   :
                             'text-sand-400',
                ].join(' ')}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={['flex-1 h-px mx-3', isDone ? 'bg-emerald-200' : 'bg-sand-200'].join(' ')}
              />
            )}
          </div>
        )
      })}
    </nav>
  )
}
