'use client'

import { useRouter, usePathname } from 'next/navigation'

const OPTIONS = [
  { key: '7',   label: '7 jours' },
  { key: '30',  label: '30 jours' },
  { key: '90',  label: '90 jours' },
  { key: 'all', label: 'Tout' },
] as const

type PeriodKey = '7' | '30' | '90' | 'all'

export default function PeriodPicker({ current }: { current: PeriodKey }) {
  const router   = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 rounded-lg border border-sand-200 bg-sand-50 p-1">
      {OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => router.push(`${pathname}?period=${opt.key}`)}
          className={[
            'rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors',
            current === opt.key
              ? 'bg-white text-sand-900 shadow-ds-sm'
              : 'text-sand-500 hover:text-sand-700',
          ].join(' ')}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
