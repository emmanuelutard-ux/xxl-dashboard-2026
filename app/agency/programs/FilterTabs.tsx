'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'

export interface FilterOption {
  key:   string
  label: string
  count: number
}

export default function FilterTabs({ options, current }: {
  options: FilterOption[]
  current: string
}) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const navigate = useCallback((key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (key === 'all') params.delete('filter')
    else params.set('filter', key)
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  return (
    <div className="flex items-center gap-1 rounded-lg border border-sand-200 bg-sand-50 p-1">
      {options.map(opt => (
        <button
          key={opt.key}
          onClick={() => navigate(opt.key)}
          className={[
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors whitespace-nowrap',
            current === opt.key
              ? 'bg-white text-sand-900 shadow-ds-sm'
              : 'text-sand-500 hover:text-sand-700',
          ].join(' ')}
        >
          {opt.label}
          <span className={[
            'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
            current === opt.key ? 'bg-sand-100 text-sand-600' : 'text-sand-400',
          ].join(' ')}>
            {opt.count}
          </span>
        </button>
      ))}
    </div>
  )
}
