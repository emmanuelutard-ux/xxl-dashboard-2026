'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'

const OPTIONS = [
  { key: '7j',    label: '7 j' },
  { key: '30j',   label: '30 j' },
  { key: '90j',   label: '90 j' },
  { key: 'total', label: 'Tout' },
] as const

type PeriodKey = typeof OPTIONS[number]['key']

export default function BilanPeriodPicker({ current }: { current: PeriodKey }) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const navigate = useCallback((key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', key)
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  return (
    <div className="flex items-center gap-1 rounded-lg border border-sand-200 bg-sand-50 p-1">
      {OPTIONS.map(opt => (
        <button
          key={opt.key}
          onClick={() => navigate(opt.key)}
          className={[
            'rounded-md px-3 py-1 text-[11px] font-medium transition-colors whitespace-nowrap',
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
