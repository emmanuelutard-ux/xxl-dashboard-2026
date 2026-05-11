import { SparkLine } from './SparkLine'

export type KPITone = 'default' | 'success' | 'warning' | 'danger'

const toneTextClass: Record<KPITone, string> = {
  default: 'text-sand-500',
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger:  'text-rose-700',
}

type Props = {
  label: string
  value: string | number
  sub?: string
  tone?: KPITone
  spark?: number[]
}

export function KPI({ label, value, sub, tone = 'default', spark }: Props) {
  return (
    <div className="bg-white border border-sand-200 rounded-ds-lg p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-sand-500 tracking-[0.04em]">{label}</span>
        {spark && <SparkLine data={spark} />}
      </div>
      <div
        className="text-[28px] font-semibold text-sand-900 leading-none tabular-nums"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>
      {sub && (
        <div className={`text-xs ${toneTextClass[tone]}`}>{sub}</div>
      )}
    </div>
  )
}

export default KPI
