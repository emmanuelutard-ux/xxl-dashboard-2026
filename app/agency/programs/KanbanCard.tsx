'use client'

import { useTransition, useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, ExternalLink, Loader2, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateProgramStatus, type ProgramStatus } from '@/app/actions/updateProgramStatus'
import { deleteProgram } from '@/app/actions/deleteProgram'
import { connectProgramAccounts } from '@/app/actions/connectProgramAccounts'

function fmtDate(iso: string): string {
  const s = iso.slice(0, 10).split('-')
  return `${s[2]}/${s[1]}/${s[0]}`
}

export interface KanbanProgram {
  id: string
  name: string
  location: string | null
  status: string
  budget_google: number | null
  budget_meta: number | null
  start_date: string | null
  end_date: string | null
  promoteur: string | null
  cpl_cible: number | null
  live_metrics: {
    spent: number
    leads: number
    cpl: number | null
    budget_pct: number | null
    time_pct: number | null
  } | null
}

interface Props {
  program: KanbanProgram
  nextStatus: ProgramStatus | null
  nextLabel: string | null
}

// Barre de progression compacte
function ProgressBar({ pct, colorCls }: { pct: number; colorCls: string }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100">
      <div
        className={cn('h-1.5 rounded-full transition-all', colorCls)}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default function KanbanCard({ program, nextStatus, nextLabel }: Props) {
  const [pending, startTransition] = useTransition()

  // ── Menu ⋮ ───────────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen]       = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  // ── Suppression ───────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [deleteError, setDeleteError]     = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    const res = await deleteProgram(program.id)
    if (!res.success) {
      setDeleteError(res.error ?? 'Erreur inconnue')
      setDeleting(false)
    }
    // Si succès, le revalidatePath rafraîchit la page — pas besoin de reset le state
  }

  // ── Connexion comptes ─────────────────────────────────────────────────────
  const [showConnect, setShowConnect]   = useState(false)
  const [googleId, setGoogleId]         = useState('')
  const [metaId, setMetaId]             = useState('')
  const [connecting, setConnecting]     = useState(false)
  const [connectMsg, setConnectMsg]     = useState<{ ok: boolean; text: string } | null>(null)

  async function handleConnect() {
    setConnecting(true)
    setConnectMsg(null)
    const res = await connectProgramAccounts(program.id, googleId, metaId)
    if (res.success) {
      setConnectMsg({ ok: true, text: 'Comptes enregistrés.' })
      setTimeout(() => setShowConnect(false), 800)
    } else {
      setConnectMsg({ ok: false, text: res.error ?? 'Erreur inconnue' })
    }
    setConnecting(false)
  }

  // ── Avancer dans le pipeline ──────────────────────────────────────────────
  const budgetTotal =
    (Number(program.budget_google) || 0) + (Number(program.budget_meta) || 0)

  function handleAvancer() {
    if (!nextStatus) return
    startTransition(async () => {
      await updateProgramStatus(program.id, nextStatus)
    })
  }

  const m = program.live_metrics

  return (
    <>
      <div className="relative flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">

        {/* ── Bouton ⋮ ── */}
        <div ref={menuRef} className="absolute right-2 top-2 z-10">
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            className="flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-7 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
              <Link
                href={`/agency/programs/${program.id}`}
                onClick={() => setMenuOpen(false)}
                className="flex w-full items-center px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Modifier
              </Link>
              <button
                type="button"
                onClick={() => { setConfirmDelete(true); setMenuOpen(false) }}
                className="flex w-full items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
              >
                Supprimer
              </button>
              <button
                type="button"
                onClick={() => { setShowConnect(true); setMenuOpen(false) }}
                className="flex w-full items-center px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Connecter
              </button>
            </div>
          )}
        </div>

        {/* Nom + ville */}
        <div className="pr-6">
          <p className="font-semibold text-slate-900 leading-tight">{program.name}</p>
          {program.location && (
            <p className="mt-0.5 text-xs text-slate-500">{program.location}</p>
          )}
        </div>

        {/* Méta-données */}
        <dl className="space-y-1">
          {program.promoteur && (
            <div className="flex justify-between text-xs">
              <dt className="text-slate-400">Promoteur</dt>
              <dd className="font-medium text-slate-700">{program.promoteur}</dd>
            </div>
          )}
          {budgetTotal > 0 && (
            <div className="flex justify-between text-xs">
              <dt className="text-slate-400">Budget total</dt>
              <dd className="font-medium text-slate-700">{budgetTotal.toLocaleString('fr-FR')} €</dd>
            </div>
          )}
          {program.cpl_cible && (
            <div className="flex justify-between text-xs">
              <dt className="text-slate-400">CPL cible</dt>
              <dd className="font-medium text-green-700">{program.cpl_cible} €</dd>
            </div>
          )}
          {program.start_date && (
            <div className="flex justify-between text-xs">
              <dt className="text-slate-400">Lancement</dt>
              <dd className="font-medium text-slate-700">
                {fmtDate(program.start_date)}
              </dd>
            </div>
          )}
        </dl>

        {/* ── Indicateurs live ── */}
        {program.status === 'live' && (
          <div className="space-y-2.5 border-t border-slate-100 pt-2.5">

            {/* Temps écoulé */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Temps écoulé</span>
                <span className="font-medium text-slate-700">
                  {m?.time_pct != null ? `${m.time_pct}%` : '–'}
                </span>
              </div>
              {m?.time_pct != null && (
                <ProgressBar pct={m.time_pct} colorCls="bg-slate-400" />
              )}
            </div>

            {/* Budget dépensé */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Budget dépensé</span>
                <span className={cn(
                  'font-medium',
                  m?.budget_pct != null && m.budget_pct > 80 ? 'text-red-600' :
                  m?.budget_pct != null && m.budget_pct > 60 ? 'text-amber-600' : 'text-slate-700'
                )}>
                  {m?.budget_pct != null
                    ? `${m.budget_pct}% · ${m.spent.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`
                    : '–'}
                </span>
              </div>
              {m?.budget_pct != null && (
                <ProgressBar
                  pct={m.budget_pct}
                  colorCls={
                    m.budget_pct > 80 ? 'bg-red-500' :
                    m.budget_pct > 60 ? 'bg-amber-400' : 'bg-blue-500'
                  }
                />
              )}
            </div>

            {/* CPL actuel */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">CPL actuel</span>
              <span className={cn(
                'font-medium',
                m?.cpl != null && program.cpl_cible && m.cpl > program.cpl_cible
                  ? 'text-red-600'
                  : 'text-slate-700'
              )}>
                {m?.cpl != null
                  ? `${m.cpl.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
                  : m?.leads === 0 ? `0 contact` : '–'}
              </span>
            </div>

          </div>
        )}

        {/* ── Confirmation suppression ── */}
        {confirmDelete && (
          <div className="rounded-lg border border-red-100 bg-red-50 p-3">
            {deleteError ? (
              <p className="mb-2 text-xs text-red-600">{deleteError}</p>
            ) : (
              <p className="mb-2 text-xs font-medium text-red-700">Confirmer la suppression ?</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? <Loader2 className="mx-auto h-3.5 w-3.5 animate-spin" /> : 'Oui, supprimer'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => { setConfirmDelete(false); setDeleteError(null) }}
                className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        {!confirmDelete && (
          <div className="flex gap-2 pt-1">
            <Link
              href={`/agency/programs/${program.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ouvrir
            </Link>

            {nextStatus && nextLabel && (
              <button
                type="button"
                disabled={pending}
                onClick={handleAvancer}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition',
                  pending
                    ? 'bg-slate-100 text-slate-400'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                {pending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5" />
                )}
                {pending ? '...' : nextLabel}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Modale Connecter (fixed, hors flux de la carte) ── */}
      {showConnect && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowConnect(false) }}
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-base font-semibold text-slate-900">Connecter les comptes</h3>
            <p className="mb-4 text-xs text-slate-500">{program.name}</p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  ID compte Google Ads
                </label>
                <input
                  type="text"
                  value={googleId}
                  onChange={(e) => setGoogleId(e.target.value)}
                  placeholder="ex: 802-918-8856"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">
                  ID compte Meta Ads
                </label>
                <input
                  type="text"
                  value={metaId}
                  onChange={(e) => setMetaId(e.target.value)}
                  placeholder="ex: act_123456789"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {connectMsg && (
              <p className={cn('mt-3 text-xs', connectMsg.ok ? 'text-green-700' : 'text-red-600')}>
                {connectMsg.text}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={connecting}
                onClick={handleConnect}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {connecting ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Enregistrer'}
              </button>
              <button
                type="button"
                disabled={connecting}
                onClick={() => { setShowConnect(false); setConnectMsg(null) }}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
