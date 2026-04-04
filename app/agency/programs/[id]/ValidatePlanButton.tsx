'use client'

import { useState } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateMediaPlan } from '@/app/actions/validateMediaPlan'

interface Props {
  programId: string
  initialValidated: boolean
}

export default function ValidatePlanButton({ programId, initialValidated }: Props) {
  const [validated, setValidated] = useState(initialValidated)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleValidate() {
    setLoading(true)
    setError(null)
    const result = await validateMediaPlan(programId)
    setLoading(false)
    if (result.success) {
      setValidated(true)
      setConfirmed(true)
    } else {
      setError(result.error ?? 'Une erreur est survenue.')
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 border-t border-slate-200 pt-8 pb-6">
      {confirmed && (
        <p className="text-sm font-medium text-green-700">
          Plan média validé — vous pouvez maintenant passer à la création des campagnes.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={validated || loading}
        onClick={handleValidate}
        className={cn(
          'flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold shadow-sm transition active:scale-[0.98]',
          validated
            ? 'cursor-default bg-slate-100 text-slate-500 shadow-none'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        )}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        {loading ? 'Validation...' : validated ? 'Plan validé ✓' : 'Valider le plan média'}
      </button>
    </div>
  )
}
