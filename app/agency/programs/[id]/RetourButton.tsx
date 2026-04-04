'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { saveRetour, type Retour } from '@/app/actions/saveRetour'

function fmtDateTime(iso: string): string {
  const d = new Date(iso)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${h}:${min}`
}

interface Props {
  programId: string
  section: string
  initialRetours: Retour[]
  auteur: string
}

export default function RetourButton({ programId, section, initialRetours, auteur }: Props) {
  const [open, setOpen] = useState(false)
  const [retours, setRetours] = useState<Retour[]>(initialRetours)
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Fermeture au clic extérieur
  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  async function handleSave() {
    const text = commentaire.trim()
    if (!text) return
    setSaving(true)
    const result = await saveRetour(programId, { section, commentaire: text, auteur })
    if (result.success) {
      setRetours((prev) => [
        ...prev,
        { section, commentaire: text, auteur, date: new Date().toISOString() },
      ])
      setCommentaire('')
    }
    setSaving(false)
  }

  const count = retours.length

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors',
          count > 0
            ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
        )}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {count > 0 ? `${count} retour${count > 1 ? 's' : ''}` : 'Retour'}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl">
          {/* En-tête panneau */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <p className="text-xs font-semibold text-slate-700">Retours · {section}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Liste des retours existants */}
          {retours.length > 0 && (
            <div className="max-h-48 divide-y divide-slate-100 overflow-y-auto px-4 py-1">
              {retours.map((r, i) => (
                <div key={i} className="py-2.5">
                  <p className="text-xs text-slate-800">{r.commentaire}</p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {r.auteur} · {fmtDateTime(r.date)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Zone de saisie */}
          <div className="border-t border-slate-100 p-3">
            <textarea
              rows={3}
              placeholder="Votre commentaire..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              disabled={saving || !commentaire.trim()}
              onClick={handleSave}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
              {saving ? 'Envoi...' : 'Envoyer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
