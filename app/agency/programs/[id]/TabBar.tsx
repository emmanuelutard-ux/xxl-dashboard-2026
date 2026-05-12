'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { useCallback } from 'react'

const TABS = [
  { key: 'performance',  label: 'Performance' },
  { key: 'plan',         label: 'Plan média' },
  { key: 'campagnes',    label: 'Campagnes' },
  { key: 'brief',        label: 'Brief & cibles' },
  { key: 'bilan',        label: 'Bilan' },
] as const

type TabKey = typeof TABS[number]['key']

export default function TabBar({ current }: { current: TabKey }) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const navigate = useCallback((key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', key)
    // Reset canal when switching tabs
    params.delete('canal')
    router.push(`${pathname}?${params.toString()}`)
  }, [pathname, router, searchParams])

  return (
    <div className="flex border-b border-sand-200">
      {TABS.map(tab => {
        const active = current === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.key)}
            className={[
              'px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap',
              active
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-sand-500 hover:text-sand-800',
            ].join(' ')}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
