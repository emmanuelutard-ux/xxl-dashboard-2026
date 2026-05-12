'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ArrowRight, Check, Loader2, Sparkles, ChevronRight,
} from 'lucide-react'
import { createProgramFromBrief, type BriefV2Data } from '@/app/actions/createProgramFromBrief'
import StepBar   from './StepBar'
import AiSidekick from './AiSidekick'

// ─── Types ─────────────────────────────────────────────────────────────────────

type ProfileTarget = 'primo' | 'investisseur' | 'famille' | 'senior'
type CrmProvider   = BriefV2Data['crm_provider']

interface FormState {
  name:              string
  location:          string
  promoteur:         string
  lot_count:         string
  has_brs:           boolean
  notes:             string
  target_profiles:   ProfileTarget[]
  usp:               string
  google_active:     boolean
  budget_google:     string
  google_start:      string
  google_end:        string
  meta_active:       boolean
  budget_meta:       string
  meta_start:        string
  meta_end:          string
  landing_page_url:  string
  lp_not_ready:      boolean
  crm_provider:      CrmProvider
}

interface MediaPlan {
  summary:          string
  google_strategy:  string
  meta_strategy:    string
  expected_cpl:     string
  timeline:         string
}

const INITIAL: FormState = {
  name: '', location: '', promoteur: '', lot_count: '',
  has_brs: false, notes: '',
  target_profiles: [], usp: '',
  google_active: true, budget_google: '', google_start: '', google_end: '',
  meta_active: true,   budget_meta: '',  meta_start: '',  meta_end: '',
  landing_page_url: '', lp_not_ready: false, crm_provider: 'aucun',
}

const DRAFT_KEY = 'xxl-brief-draft-v2'
const STEPS = ['Programme', 'Cible & USP', 'Budget & dates', 'Validation']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function budgetPerDay(budget: string, start: string, end: string): number | null {
  const b = Number(budget)
  if (!b || !start || !end) return null
  const days = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000
  )
  if (days <= 0) return null
  return Math.round(b / days)
}

function fmtN(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ─── DS primitives ────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-ds-sm border border-sand-200 bg-white px-3 py-2 text-[13px] text-sand-900 placeholder:text-sand-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors'

const labelCls =
  'block text-[11px] font-semibold text-sand-500 tracking-[0.04em] uppercase mb-1.5'

function FieldBlock({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={[
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300',
        enabled ? 'border-indigo-600 bg-indigo-600' : 'border-sand-200 bg-sand-100',
      ].join(' ')}
    >
      <span
        className={[
          'pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow-ds-sm transition-transform',
          enabled ? 'translate-x-[18px]' : 'translate-x-0.5',
        ].join(' ')}
      />
    </button>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm">
      <div className="border-b border-sand-100 px-5 py-3.5">
        <h3 className="text-[13px] font-semibold text-sand-900">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

// ─── Step 1 — Programme ───────────────────────────────────────────────────────

function Step1({ state, set }: { state: FormState; set: Setter }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Informations programme">
        <div className="grid grid-cols-2 gap-4">
          <FieldBlock label="Nom du programme" required>
            <input
              type="text"
              placeholder="Ex. Résidence Galliéni"
              value={state.name}
              onChange={e => set('name', e.target.value)}
              className={inputCls}
              autoFocus
            />
          </FieldBlock>
          <FieldBlock label="Ville">
            <input
              type="text"
              placeholder="Ex. Nanterre"
              value={state.location}
              onChange={e => set('location', e.target.value)}
              className={inputCls}
            />
          </FieldBlock>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FieldBlock label="Promoteur">
            <input
              type="text"
              placeholder="Ex. Foncière Siba"
              value={state.promoteur}
              onChange={e => set('promoteur', e.target.value)}
              className={inputCls}
            />
          </FieldBlock>
          <FieldBlock label="Nombre de lots">
            <input
              type="number"
              min="1"
              placeholder="Ex. 42"
              value={state.lot_count}
              onChange={e => set('lot_count', e.target.value)}
              className={inputCls}
            />
          </FieldBlock>
        </div>

        <div className="flex items-center justify-between rounded-ds-sm border border-sand-200 bg-sand-50 px-4 py-3">
          <div>
            <p className="text-[13px] font-medium text-sand-800">Présence de lots BRS</p>
            <p className="text-[11px] text-sand-500 mt-0.5">Bail Réel Solidaire — déclenche une campagne dédiée</p>
          </div>
          <Toggle enabled={state.has_brs} onChange={v => set('has_brs', v)} />
        </div>
      </SectionCard>

      <SectionCard title="Notes complémentaires">
        <textarea
          rows={3}
          placeholder="Contraintes spécifiques, contexte, remarques particulières..."
          value={state.notes}
          onChange={e => set('notes', e.target.value)}
          className={inputCls + ' resize-none'}
        />
      </SectionCard>
    </div>
  )
}

// ─── Step 2 — Cible & USP ─────────────────────────────────────────────────────

const PROFILES: { key: ProfileTarget; label: string; desc: string }[] = [
  { key: 'primo',        label: 'Primo-accédants', desc: 'Jeunes actifs, ménages modestes, 1er achat' },
  { key: 'investisseur', label: 'Investisseurs',   desc: 'Résidence secondaire, Pinel, LMNP' },
  { key: 'famille',      label: 'Familles',         desc: 'T3/T4, besoin de logement plus grand' },
  { key: 'senior',       label: 'Seniors',          desc: 'Retraités, cherchent à réduire la surface' },
]

function Step2({ state, set }: { state: FormState; set: Setter }) {
  function toggleProfile(key: ProfileTarget) {
    const current = state.target_profiles
    set('target_profiles',
      current.includes(key)
        ? current.filter(p => p !== key)
        : [...current, key]
    )
  }

  return (
    <div className="space-y-4">
      <SectionCard title="Profils acheteurs cibles">
        <p className="text-[12px] text-sand-500 -mt-1">Sélectionnez un ou plusieurs profils.</p>
        <div className="grid grid-cols-2 gap-3">
          {PROFILES.map(p => {
            const active = state.target_profiles.includes(p.key)
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => toggleProfile(p.key)}
                className={[
                  'rounded-ds-sm border px-4 py-3 text-left transition-colors',
                  active
                    ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                    : 'border-sand-200 bg-white hover:bg-sand-50',
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <p className={['text-[13px] font-semibold', active ? 'text-indigo-700' : 'text-sand-900'].join(' ')}>
                    {p.label}
                  </p>
                  {active && (
                    <div className="h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-sand-400 mt-0.5">{p.desc}</p>
              </button>
            )
          })}
        </div>
      </SectionCard>

      <SectionCard title="Arguments de vente (USP)">
        <FieldBlock label="Points forts du programme">
          <textarea
            rows={5}
            placeholder="Ex. Livraison T3 2026 · Plein pied piéton gare · Terrasses privatives · BRS disponible · Prix 10% sous marché local..."
            value={state.usp}
            onChange={e => set('usp', e.target.value)}
            className={inputCls + ' resize-none'}
          />
          <p className="mt-1 text-[11px] text-sand-400">
            Ces éléments seront injectés dans la génération du contenu publicitaire.
          </p>
        </FieldBlock>
      </SectionCard>
    </div>
  )
}

// ─── Step 3 — Budget & dates ──────────────────────────────────────────────────

function PlatformBlock({
  platform, active, budget, start, end,
  onToggle, onBudget, onStart, onEnd,
}: {
  platform: 'google' | 'meta'
  active:   boolean
  budget:   string
  start:    string
  end:      string
  onToggle: () => void
  onBudget: (v: string) => void
  onStart:  (v: string) => void
  onEnd:    (v: string) => void
}) {
  const bpd      = budgetPerDay(budget, start, end)
  const isGoogle = platform === 'google'

  return (
    <div className={[
      'rounded-[10px] border bg-white transition-all',
      active ? 'border-sand-200 shadow-ds-sm' : 'border-sand-100 opacity-50',
    ].join(' ')}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-sand-100">
        <div className="flex items-center gap-2.5">
          <div className={[
            'h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0',
            isGoogle ? 'bg-terra-500' : 'bg-indigo-600',
          ].join(' ')}>
            {isGoogle ? 'G' : 'M'}
          </div>
          <span className="text-[13px] font-semibold text-sand-900">
            {isGoogle ? 'Google Ads' : 'Meta Ads'}
          </span>
        </div>
        <Toggle enabled={active} onChange={onToggle} />
      </div>

      {/* Body */}
      <div className={['p-5 space-y-3.5', !active && 'pointer-events-none select-none'].join(' ')}>
        <FieldBlock label="Budget total (€)">
          <div className="relative">
            <input
              type="number"
              min="0"
              step="100"
              placeholder="Ex. 2 000"
              value={budget}
              onChange={e => onBudget(e.target.value)}
              className={inputCls + ' pr-7'}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-sand-300 pointer-events-none">€</span>
          </div>
          {bpd !== null && (
            <p className="mt-1 text-[11px] text-sand-500">
              ≈ <span className="font-semibold text-sand-800 tabular-nums">{fmtN(bpd)} €</span> / jour
            </p>
          )}
        </FieldBlock>

        <div className="grid grid-cols-2 gap-3">
          <FieldBlock label="Date de début">
            <input
              type="date"
              value={start}
              onChange={e => onStart(e.target.value)}
              className={inputCls}
            />
          </FieldBlock>
          <FieldBlock label="Date de fin">
            <input
              type="date"
              value={end}
              onChange={e => onEnd(e.target.value)}
              className={inputCls}
            />
          </FieldBlock>
        </div>
      </div>
    </div>
  )
}

function Step3({ state, set }: { state: FormState; set: Setter }) {
  const noneActive = !state.google_active && !state.meta_active

  return (
    <div className="space-y-4">
      {noneActive && (
        <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
          Activez au moins une plateforme pour passer à l'étape suivante.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <PlatformBlock
          platform="google"
          active={state.google_active}
          budget={state.budget_google}
          start={state.google_start}
          end={state.google_end}
          onToggle={() => set('google_active', !state.google_active)}
          onBudget={v => set('budget_google', v)}
          onStart={v => set('google_start', v)}
          onEnd={v => set('google_end', v)}
        />
        <PlatformBlock
          platform="meta"
          active={state.meta_active}
          budget={state.budget_meta}
          start={state.meta_start}
          end={state.meta_end}
          onToggle={() => set('meta_active', !state.meta_active)}
          onBudget={v => set('budget_meta', v)}
          onStart={v => set('meta_start', v)}
          onEnd={v => set('meta_end', v)}
        />
      </div>

      <SectionCard title="Landing page & CRM">
        <div className="flex items-center justify-between rounded-ds-sm border border-sand-200 bg-sand-50 px-4 py-2.5">
          <span className="text-[12px] text-sand-700">La landing page n&apos;est pas encore prête</span>
          <Toggle enabled={state.lp_not_ready} onChange={v => set('lp_not_ready', v)} />
        </div>

        {!state.lp_not_ready && (
          <FieldBlock label="URL de la landing page">
            <input
              type="url"
              placeholder="https://..."
              value={state.landing_page_url}
              onChange={e => set('landing_page_url', e.target.value)}
              className={inputCls}
            />
          </FieldBlock>
        )}

        <FieldBlock label="CRM du promoteur">
          <select
            value={state.crm_provider}
            onChange={e => set('crm_provider', e.target.value as CrmProvider)}
            className={inputCls}
          >
            <option value="aucun">Aucun</option>
            <option value="unlatch">Unlatch</option>
            <option value="adlead">Adlead</option>
            <option value="google_sheets">Google Sheets</option>
            <option value="autre">Autre</option>
          </select>
        </FieldBlock>
      </SectionCard>
    </div>
  )
}

// ─── Step 4 — Validation IA ───────────────────────────────────────────────────

function Step4({
  state, plan, planLoading,
}: { state: FormState; plan: MediaPlan | null; planLoading: boolean }) {
  const budgetTotal = (Number(state.budget_google) || 0) + (Number(state.budget_meta) || 0)
  const platforms   = [
    state.google_active && 'Google Ads',
    state.meta_active   && 'Meta Ads',
  ].filter(Boolean).join(' + ')

  const recap = [
    { label: 'Programme',    value: state.name            || '—' },
    { label: 'Ville',        value: state.location        || '—' },
    { label: 'Promoteur',    value: state.promoteur       || '—' },
    { label: 'Lots',         value: state.lot_count       || '—' },
    { label: 'BRS',          value: state.has_brs ? 'Oui' : 'Non' },
    { label: 'Plateformes',  value: platforms              || '—' },
    { label: 'Budget total', value: budgetTotal > 0 ? `${fmtN(budgetTotal)} €` : '—' },
    { label: 'CRM',          value: state.crm_provider },
  ]

  return (
    <div className="space-y-4">
      {/* Récap brief */}
      <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm">
        <div className="border-b border-sand-100 px-5 py-3.5">
          <h3 className="text-[13px] font-semibold text-sand-900">Récapitulatif du brief</h3>
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-3">
          {recap.map(({ label, value }) => (
            <div key={label}>
              <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.04em] mb-0.5">{label}</p>
              <p className="text-[13px] text-sand-900">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan IA */}
      <div className="rounded-[10px] border border-indigo-100 bg-indigo-50">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-indigo-100">
          <Sparkles className="h-4 w-4 text-indigo-600" />
          <span className="text-[13px] font-semibold text-indigo-800">Plan média suggéré</span>
        </div>

        <div className="p-5">
          {planLoading && (
            <div className="flex items-center gap-2 text-[12px] text-indigo-500 py-4">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyse du brief en cours...
            </div>
          )}

          {!planLoading && plan && (
            <div className="space-y-4">
              <p className="text-[12px] text-indigo-700 leading-relaxed">{plan.summary}</p>

              <div className="grid grid-cols-2 gap-3">
                {state.google_active && (
                  <div className="rounded-ds-sm bg-white border border-indigo-100 p-3.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="h-4 w-4 rounded-full bg-terra-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">G</div>
                      <p className="text-[10px] font-semibold text-sand-500 uppercase tracking-[0.04em]">Google Ads</p>
                    </div>
                    <p className="text-[12px] text-sand-800 leading-relaxed">{plan.google_strategy}</p>
                  </div>
                )}
                {state.meta_active && (
                  <div className="rounded-ds-sm bg-white border border-indigo-100 p-3.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center text-[9px] font-bold text-white shrink-0">M</div>
                      <p className="text-[10px] font-semibold text-sand-500 uppercase tracking-[0.04em]">Meta Ads</p>
                    </div>
                    <p className="text-[12px] text-sand-800 leading-relaxed">{plan.meta_strategy}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6 pt-1">
                <div>
                  <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.04em]">CPL estimé</p>
                  <p className="text-[14px] font-semibold text-emerald-700 tabular-nums">{plan.expected_cpl}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.04em]">Calendrier</p>
                  <p className="text-[13px] text-sand-800">{plan.timeline}</p>
                </div>
              </div>
            </div>
          )}

          {!planLoading && !plan && (
            <p className="text-[12px] text-indigo-400 py-4">
              Impossible de générer le plan. Vous pouvez tout de même créer le programme.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type Setter = (k: keyof FormState, v: unknown) => void

export default function NouveauBriefPage() {
  const router   = useRouter()
  const [step,   setStep]   = useState(1)
  const [state,  setState]  = useState<FormState>(INITIAL)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [plan,  setPlan]    = useState<MediaPlan | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Load draft on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) setState(JSON.parse(saved) as FormState)
    } catch { /* ignore */ }
  }, [])

  // ── Auto-save draft with 2s debounce ────────────────────────────────────────
  useEffect(() => {
    if (draftTimer.current) clearTimeout(draftTimer.current)
    draftTimer.current = setTimeout(() => {
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)) } catch { /* ignore */ }
    }, 2000)
    return () => { if (draftTimer.current) clearTimeout(draftTimer.current) }
  }, [state])

  // ── Fetch AI plan when entering step 4 ─────────────────────────────────────
  useEffect(() => {
    if (step !== 4) return
    setPlanLoading(true)
    setPlan(null)
    fetch('/api/ai/brief-suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    })
      .then(r => r.json())
      .then((data: MediaPlan) => { setPlan(data); setPlanLoading(false) })
      .catch(() => setPlanLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const set = useCallback<Setter>((k, v) => {
    setState(prev => ({ ...prev, [k]: v }))
  }, [])

  // ── Validation ──────────────────────────────────────────────────────────────
  function canAdvance(): boolean {
    if (step === 1) return state.name.trim().length > 0
    if (step === 3) return state.google_active || state.meta_active
    return true
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  function goNext() {
    if (!canAdvance()) return
    setStep(s => Math.min(s + 1, 4))
    setError(null)
  }

  function goBack() {
    if (step === 1) {
      router.push('/agency/programs')
    } else {
      setStep(s => s - 1)
      setError(null)
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleCreate() {
    setError(null)
    setSubmitting(true)

    const result = await createProgramFromBrief({
      name:             state.name,
      location:         state.location,
      promoteur:        state.promoteur,
      lot_count:        state.lot_count ? Number(state.lot_count) : null,
      has_brs:          state.has_brs,
      notes:            state.notes,
      target_profiles:  state.target_profiles,
      usp:              state.usp,
      google_active:    state.google_active,
      budget_google:    Number(state.budget_google) || 0,
      google_start:     state.google_start  || null,
      google_end:       state.google_end    || null,
      meta_active:      state.meta_active,
      budget_meta:      Number(state.budget_meta) || 0,
      meta_start:       state.meta_start    || null,
      meta_end:         state.meta_end      || null,
      landing_page_url: state.landing_page_url,
      lp_not_ready:     state.lp_not_ready,
      crm_provider:     state.crm_provider,
      ai_plan:          plan ? (plan as unknown as Record<string, unknown>) : null,
    })

    if (!result.success || !result.programId) {
      setSubmitting(false)
      setError(result.error ?? 'Une erreur est survenue.')
      return
    }

    try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
    router.push(`/agency/programs/${result.programId}`)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">

      {/* TopBar */}
      <header className="flex items-center justify-between pl-14 pr-4 md:px-6 py-3.5 border-b border-sand-200 bg-white shrink-0">
        <div className="flex items-center gap-1.5 text-[12px] text-sand-400">
          <Link href="/agency/programs" className="hover:text-sand-700 transition-colors">
            Programmes
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-sand-700 font-medium">Nouveau brief</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)) } catch { /* */ }
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-ds-sm border border-sand-200 bg-white text-sand-600 hover:bg-sand-50 transition-colors"
          >
            Enregistrer brouillon
          </button>
          {step === 4 && (
            <button
              type="button"
              onClick={handleCreate}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-ds-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
              Créer le programme
            </button>
          )}
        </div>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">

          {/* StepBar */}
          <StepBar current={step} steps={STEPS} />

          {/* 2-col layout */}
          <div className="flex gap-5 items-start">

            {/* Form — 75% */}
            <div className="flex-1 min-w-0 space-y-0">
              {step === 1 && <Step1 state={state} set={set} />}
              {step === 2 && <Step2 state={state} set={set} />}
              {step === 3 && <Step3 state={state} set={set} />}
              {step === 4 && <Step4 state={state} plan={plan} planLoading={planLoading} />}

              {error && (
                <div className="mt-4 rounded-[10px] border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">
                  {error}
                </div>
              )}

              {/* Navigation */}
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium rounded-ds-sm border border-sand-200 bg-white text-sand-700 hover:bg-sand-50 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {step > 1 ? 'Étape précédente' : 'Annuler'}
                </button>

                {step < 4 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canAdvance()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium rounded-ds-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Étape suivante
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium rounded-ds-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
                  >
                    {submitting
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Check className="h-3.5 w-3.5" />
                    }
                    {submitting ? 'Création en cours...' : 'Créer le programme'}
                  </button>
                )}
              </div>
            </div>

            {/* AI Sidekick — 25% */}
            <div className="w-60 shrink-0 sticky top-6">
              <AiSidekick
                step={step}
                hasBrs={state.has_brs}
                targetProfiles={state.target_profiles}
                budgetGoogle={state.budget_google}
                budgetMeta={state.budget_meta}
                googleActive={state.google_active}
                metaActive={state.meta_active}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
