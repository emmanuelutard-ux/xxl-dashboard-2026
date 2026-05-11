'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

// ── Icons ──────────────────────────────────────────────────────────────────────

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
const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6"/>
  </svg>
)
const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6"/>
  </svg>
)
const MenuIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12h18M3 6h18M3 18h18"/>
  </svg>
)
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)

// ── Nav items ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { key: 'home',     label: 'Tableau de bord',  href: '/agency',          Icon: HomeIcon    },
  { key: 'programs', label: 'Programmes',        href: '/agency/programs', Icon: FolderIcon  },
  { key: 'pipeline', label: 'Pipeline',          href: '/agency/pipeline', Icon: ColumnsIcon },
  { key: 'briefs',   label: 'Briefs en attente', href: '/agency/briefs',   Icon: InboxIcon   },
  { key: 'reports',  label: 'Bilans clients',    href: '/agency/reports',  Icon: FileIcon    },
] as const

const LS_KEY = 'xxl_sidebar_collapsed'

// ── Shared nav list (used by both desktop + mobile drawer) ─────────────────────

function NavList({
  collapsed,
  active,
  onLinkClick,
}: {
  collapsed: boolean
  active: (href: string) => boolean
  onLinkClick?: () => void
}) {
  return (
    <nav className={['flex flex-col gap-0.5', collapsed ? 'px-1.5' : 'px-3'].join(' ')}>
      {NAV_ITEMS.map(({ key, label, href, Icon }) => {
        const on = active(href)
        return (
          <Link
            key={key}
            href={href}
            title={collapsed ? label : undefined}
            onClick={onLinkClick}
            className={[
              'flex items-center rounded-lg text-[13px] leading-none transition-colors',
              collapsed ? 'justify-center py-2.5 px-0' : 'gap-2.5 px-2.5 py-2',
              on
                ? 'bg-white border border-sand-200 text-sand-900 font-semibold shadow-ds-sm'
                : 'border border-transparent text-sand-700 font-medium hover:bg-sand-100',
            ].join(' ')}
          >
            <span className={on ? 'text-sand-700' : 'text-sand-400'}>
              <Icon />
            </span>
            {!collapsed && <span className="flex-1 leading-none">{label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

type Props = {
  userName?: string
  userInitials?: string
}

export default function AgencySidebar({ userName = 'Marine Martin', userInitials = 'MM' }: Props) {
  const pathname    = usePathname()
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Read persisted state after mount (localStorage unavailable during SSR)
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY)
    if (stored === 'true') setCollapsed(true)
  }, [])

  // Close mobile drawer on navigation
  useEffect(() => { setMobileOpen(false) }, [pathname])

  function isActive(href: string) {
    if (href === '/agency') return pathname === '/agency'
    return pathname.startsWith(href)
  }

  function toggleCollapsed() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem(LS_KEY, String(next))
  }

  // ── Desktop sidebar ──────────────────────────────────────────────────────────
  return (
    <>
      <aside
        className="hidden md:flex shrink-0 flex-col h-full bg-sand-50 border-r border-sand-200 overflow-hidden"
        style={{ width: collapsed ? 56 : 224, transition: 'width 220ms ease-in-out' }}
      >
        {/* Logo */}
        <div
          className={[
            'flex items-center pt-5 pb-3',
            collapsed ? 'justify-center px-0' : 'gap-2.5 px-5',
          ].join(' ')}
        >
          <div className="w-7 h-7 shrink-0 rounded-lg bg-indigo-600 grid place-items-center text-white text-base font-semibold italic leading-none">
            x
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-[13px] font-semibold text-sand-900 leading-tight whitespace-nowrap">XXL</div>
              <div className="text-[10px] text-sand-500 uppercase tracking-[0.08em] leading-tight whitespace-nowrap">Agence</div>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className={[
            'mb-3 w-6 h-6 rounded-md bg-sand-100 text-sand-500',
            'hover:bg-sand-200 grid place-items-center transition-colors',
            collapsed ? 'self-center' : 'self-end mr-3',
          ].join(' ')}
          aria-label={collapsed ? 'Déplier' : 'Replier'}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </button>

        <NavList collapsed={collapsed} active={isActive} />

        {/* User footer */}
        <div
          className={[
            'mt-auto mb-4 rounded-[10px] bg-sand-100 flex items-center',
            collapsed ? 'mx-1.5 p-2 justify-center' : 'mx-3 p-2.5 gap-2.5',
          ].join(' ')}
        >
          <div className="w-7 h-7 shrink-0 rounded-full bg-terra-500 text-white grid place-items-center text-[11px] font-semibold">
            {userInitials}
          </div>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden">
              <div className="text-[12px] font-semibold text-sand-900 leading-tight truncate whitespace-nowrap">{userName}</div>
              <div className="text-[11px] text-sand-500 leading-tight whitespace-nowrap">Agence</div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile ──────────────────────────────────────────────────────────── */}

      {/* Hamburger button — floats top-left on mobile */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-40 w-9 h-9 bg-white border border-sand-200 rounded-lg shadow-ds-md grid place-items-center text-sand-700 hover:bg-sand-50 transition-colors"
        aria-label="Ouvrir le menu"
      >
        <MenuIcon />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-sand-900/40 backdrop-blur-[1px]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Drawer — always expanded (220px) */}
      <aside
        className={[
          'md:hidden fixed inset-y-0 left-0 z-50 w-[220px]',
          'flex flex-col bg-sand-50 border-r border-sand-200',
          'transition-transform duration-[250ms] ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 grid place-items-center text-white text-base font-semibold italic leading-none">
              x
            </div>
            <div>
              <div className="text-[13px] font-semibold text-sand-900 leading-tight">XXL</div>
              <div className="text-[10px] text-sand-500 uppercase tracking-[0.08em] leading-tight">Agence</div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-7 h-7 rounded-md text-sand-500 hover:bg-sand-100 grid place-items-center transition-colors"
            aria-label="Fermer le menu"
          >
            <XIcon />
          </button>
        </div>

        <NavList collapsed={false} active={isActive} onLinkClick={() => setMobileOpen(false)} />

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
    </>
  )
}
