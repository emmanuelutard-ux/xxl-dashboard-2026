'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Kanban, Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Media Room', href: '/agency/media-room', icon: BarChart3 },
  { label: 'Pipeline',   href: '/agency/programs',   icon: Kanban },
  { label: 'Paramètres', href: '/agency/settings',   icon: Settings },
]

export default function AgencyNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    // Pipeline actif uniquement sur /agency/programs exact (pas sur /new ni /[id])
    if (href === '/agency/programs') return pathname === '/agency/programs'
    return pathname.startsWith(href)
  }

  return (
    <nav className="sticky top-0 z-10 flex h-12 items-center gap-1 border-b border-slate-200 bg-white px-6 shadow-sm">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            isActive(item.href)
              ? 'bg-blue-50 text-blue-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}

      <div className="ml-auto">
        <Link
          href="/agency/briefs/nouveau"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Brief nouveau programme
        </Link>
      </div>
    </nav>
  )
}
