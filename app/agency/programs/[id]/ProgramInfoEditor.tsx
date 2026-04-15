'use client'

import { useState } from 'react'
import { Pencil, Loader2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateProgramInfo, type ProgramInfoFields } from '@/app/actions/updateProgramInfo'

interface Props {
  programId: string
  initial: ProgramInfoFields
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value || '—'}</p>
    </div>
  )
}

function InputField({
  label, name, value, type = 'text', onChange,
}: {
  label: string
  name: string
  value: string
  type?: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}

export default function ProgramInfoEditor({ programId, initial }: Props) {
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const [startDate, setStartDate]     = useState(initial.start_date ?? '')
  const [endDate, setEndDate]         = useState(initial.end_date ?? '')
  const [budgetGoogle, setBudgetGoogle] = useState(initial.budget_google?.toString() ?? '')
  const [budgetMeta, setBudgetMeta]   = useState(initial.budget_meta?.toString() ?? '')
  const [landingUrl, setLandingUrl]   = useState(initial.landing_page_url ?? '')

  async function handleSave() {
    setSaving(true)
    setError(null)
    const res = await updateProgramInfo(programId, {
      start_date:       startDate       || null,
      end_date:         endDate         || null,
      budget_google:    budgetGoogle    ? Number(budgetGoogle)    : null,
      budget_meta:      budgetMeta      ? Number(budgetMeta)      : null,
      landing_page_url: landingUrl      || null,
    })
    setSaving(false)
    if (res.success) {
      setEditing(false)
    } else {
      setError(res.error ?? 'Erreur inconnue')
    }
  }

  function handleCancel() {
    setStartDate(initial.start_date ?? '')
    setEndDate(initial.end_date ?? '')
    setBudgetGoogle(initial.budget_google?.toString() ?? '')
    setBudgetMeta(initial.budget_meta?.toString() ?? '')
    setLandingUrl(initial.landing_page_url ?? '')
    setError(null)
    setEditing(false)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Informations campagne</h2>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                saving
                  ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              {saving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Check className="h-3.5 w-3.5" />}
              Enregistrer
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleCancel}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Annuler
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mb-3 text-xs text-red-600">{error}</p>
      )}

      {!editing ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Field label="Date début"       value={startDate  || null} />
          <Field label="Date fin"         value={endDate    || null} />
          <Field label="Budget Google"    value={budgetGoogle ? `${Number(budgetGoogle).toLocaleString('fr-FR')} €` : null} />
          <Field label="Budget Meta"      value={budgetMeta   ? `${Number(budgetMeta).toLocaleString('fr-FR')} €`   : null} />
          <Field label="URL landing page" value={landingUrl  || null} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InputField label="Date début"       name="start_date"       type="date"   value={startDate}     onChange={setStartDate} />
          <InputField label="Date fin"         name="end_date"         type="date"   value={endDate}       onChange={setEndDate} />
          <InputField label="Budget Google (€)" name="budget_google"   type="number" value={budgetGoogle}   onChange={setBudgetGoogle} />
          <InputField label="Budget Meta (€)"  name="budget_meta"     type="number" value={budgetMeta}     onChange={setBudgetMeta} />
          <div className="sm:col-span-2">
            <InputField label="URL landing page" name="landing_page_url" type="url" value={landingUrl}     onChange={setLandingUrl} />
          </div>
        </div>
      )}
    </div>
  )
}
