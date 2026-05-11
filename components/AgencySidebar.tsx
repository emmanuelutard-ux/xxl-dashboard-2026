'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 11l9-8 9 8v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2v-9z"/>
  </svg>
)

const FolderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
  </svg>
)

const ColumnsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="6" height="16" rx="1"/>
    <rect x="11" y="4" width="6" height="10" rx="1"/>
  </svg>
)

const InboxIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 13l3-7h12l3 7v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6z"/>
    <path d="M3 13h5l1 2h6l1-2h5"/>
  </svg>
)

const FileIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z"/>
    <path d="M14 3v6h6"/>
  </svg>
)

const NAV_ITEMS = [
  { key: 'home',      label: 'Tableau de bord',   href: '/agency',          Icon: HomeIcon    },
  { key: 'programs',  label: 'Programmes',         href: '/agency/programs', Icon: FolderIcon  },
  { key: 'pipeline',  label: 'Pipeline',           href: '/agency/pipeline', Icon: ColumnsIcon },
  { key: 'briefs',    label: 'Briefs en attente',  href: '/agency/briefs',   Icon: InboxIcon   },
  { key: 'reports',   label: 'Bilans clients',     href: '/agency/reports',  Icon: FileIcon    },
] as const

type Props = {
  userName?: string
  userInitials?: string
}

export default function AgencySidebar({ userName = 'Marine Martin', userInitials = 'MM' }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/agency') return pathname === '/agency'
    return pathname.startsWith(href)
  }

  return (
    <aside className="w-[224px] shrink-0 bg-sand-50 border-r border-sand-200 flex flex-col h-full overflow-y-auto">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <div className="w-7 h-7 rounded-lg bg-indigo-600 grid place-items-center text-white text-base font-semibold italic leading-none">
          x
        </div>
        <div>
          <div className="text-[13px] font-semibold text-sand-900 leading-tight">XXL</div>
          <div className="text-[10px] text-sand-500 uppercase tracking-[0.08em] leading-tight">Agence</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3">
        {NAV_ITEMS.map(({ key, label, href, Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={key}
              href={href}
              className={[
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] leading-none transition-colors',
                active
                  ? 'bg-white border border-sand-200 text-sand-900 font-semibold shadow-ds-sm'
                  : 'border border-transparent text-sand-700 font-medium hover:bg-sand-100',
              ].join(' ')}
            >
              <span className={active ? 'text-sand-700' : 'text-sand-400'}>
                <Icon />
              </span>
              <span className="flex-1 leading-none">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="mt-auto mx-3 mb-4 p-2.5 rounded-[10px] bg-sand-100 flex items-center gap-2.5">
        <div className="w-7 h-7 shrink-0 rounded-full bg-terra-500 text-white grid place-items-center text-[11px] font-semibold">
          {userInitials}
        </div>
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-sand-900 leading-tight truncate">{userName}</div>
          <div className="text-[11px] text-sand-500 leading-tight">Agence</div>
        </div>
      </div>
    </aside>
  )
}
