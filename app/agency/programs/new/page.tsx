'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { createBrief, type BriefFormData, type TrackingStatus } from '@/app/actions/createBrief'
import { generateMediaPlan } from '@/app/actions/generateMediaPlan'
import { updateBriefVisuels } from '@/app/actions/updateBriefVisuels'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowLeft, Loader2, Info, Sparkles, ImagePlus, X, AlertTriangle } from 'lucide-react'

// ─── Toggle switch (BRS) ──────────────────────────────────────────────────────
function Toggle({
  enabled,
  onChange,
  id,
}: {
  enabled: boolean
  onChange: (v: boolean) => void
  id: string
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600',
        enabled ? 'bg-blue-600' : 'bg-slate-200'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          enabled ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  )
}

// ─── Sélecteur Disponible / À créer / Non dispo ──────────────────────────────
function StatusField({
  label,
  id,
  value,
  onChange,
  locked,
}: {
  label: string
  id: string
  value: TrackingStatus
  onChange: (v: TrackingStatus) => void
  locked?: boolean
}) {
  const options: { val: TrackingStatus; label: string; active: string; base: string }[] = [
    { val: 'disponible', label: 'Disponible', active: 'bg-green-100 text-green-700', base: 'text-slate-500 hover:bg-slate-50' },
    { val: 'a_creer',   label: 'À créer',    active: 'bg-amber-100 text-amber-700', base: 'text-slate-500 hover:bg-slate-50' },
    { val: 'non_dispo', label: 'Non dispo',  active: 'bg-slate-200 text-slate-600', base: 'text-slate-500 hover:bg-slate-50' },
  ]

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border px-4 py-3 transition-colors',
        locked ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'
      )}
    >
      <p className={cn('text-sm font-medium', locked ? 'text-amber-800' : 'text-slate-700')}>
        {label}
      </p>
      <div className="flex overflow-hidden rounded-lg border border-slate-200 bg-white text-xs font-medium">
        {options.map((opt, i) => (
          <button
            key={opt.val}
            type="button"
            id={`${id}-${opt.val}`}
            disabled={locked}
            onClick={() => onChange(opt.val)}
            className={cn(
              i > 0 && 'border-l border-slate-200',
              'px-3 py-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              value === opt.val ? opt.active : opt.base
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Field wrappers ───────────────────────────────────────────────────────────
function Field({
  label,
  htmlFor,
  children,
  required,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

function ToggleField({
  label,
  id,
  value,
  onChange,
  description,
}: {
  label: string
  id: string
  value: boolean
  onChange: (v: boolean) => void
  description?: string
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <Toggle enabled={value} onChange={onChange} id={id} />
    </div>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

const selectClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024
const MAX_IMAGES = 10

interface VisualFile {
  file: File
  preview: string
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NewProgramPage() {
  const router = useRouter()

  const [submitting, setSubmitting] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Champs texte / number
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [promoteur, setPromoteur] = useState('')
  const [lotCount, setLotCount] = useState('')
  const [budgetGoogle, setBudgetGoogle] = useState('')
  const [budgetMeta, setBudgetMeta] = useState('')
  const [campaignDuration, setCampaignDuration] = useState('')
  const [landingPageUrl, setLandingPageUrl] = useState('')
  const [launchDate, setLaunchDate] = useState('')
  const [notes, setNotes] = useState('')

  // Selects
  const [lpProvider, setLpProvider] = useState<BriefFormData['lp_provider']>('agency')
  const [crmProvider, setCrmProvider] = useState<BriefFormData['crm_provider']>('aucun')
  const [crmAutre, setCrmAutre] = useState('')

  // Toggle BRS
  const [hasBrs, setHasBrs] = useState(false)

  // LP pas encore prête
  const [lpNotReady, setLpNotReady] = useState(false)

  // Statuts tracking
  const [pixelMetaStatus, setPixelMetaStatus] = useState<TrackingStatus>('a_creer')
  const [googleAdsTrackingStatus, setGoogleAdsTrackingStatus] = useState<TrackingStatus>('a_creer')
  const [ga4Status, setGa4Status] = useState<TrackingStatus>('a_creer')
  const [facebookAccessStatus, setFacebookAccessStatus] = useState<TrackingStatus>('a_creer')
  const [gtmStatus, setGtmStatus] = useState<TrackingStatus>('a_creer')

  // Visuels
  const [visualFiles, setVisualFiles] = useState<VisualFile[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [visualError, setVisualError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Logique calculée
  const diffusezLP = lpProvider === 'agency' && !lpNotReady
  const allTrackingLocked = lpNotReady

  // Auto-set tracking selon état LP
  useEffect(() => {
    if (lpNotReady) {
      setPixelMetaStatus('a_creer')
      setGoogleAdsTrackingStatus('a_creer')
      setGa4Status('a_creer')
      setFacebookAccessStatus('a_creer')
      setGtmStatus('a_creer')
    } else if (lpProvider === 'agency') {
      setPixelMetaStatus('a_creer')
      setGoogleAdsTrackingStatus('a_creer')
      setGa4Status('a_creer')
    }
  }, [lpNotReady, lpProvider])

  // Nettoyage object URLs
  useEffect(() => {
    return () => {
      visualFiles.forEach(({ preview }) => URL.revokeObjectURL(preview))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Gestion visuels ──────────────────────────────────────────────────────
  const addFiles = useCallback((incoming: File[]) => {
    setVisualError(null)
    const rejected: string[] = []
    const valid: VisualFile[] = []

    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        rejected.push(`${file.name} : format non supporté (JPG, PNG ou WebP uniquement)`)
        continue
      }
      if (file.size > MAX_SIZE_BYTES) {
        rejected.push(`${file.name} : taille supérieure à 5 Mo`)
        continue
      }
      valid.push({ file, preview: URL.createObjectURL(file) })
    }

    if (rejected.length > 0) {
      setVisualError(rejected[0])
    }

    setVisualFiles((prev) => {
      const remaining = MAX_IMAGES - prev.length
      if (remaining <= 0) {
        setVisualError(`Maximum ${MAX_IMAGES} visuels atteint.`)
        return prev
      }
      return [...prev, ...valid.slice(0, remaining)]
    })
  }, [])

  function removeVisual(index: number) {
    setVisualFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  // ─── Soumission ──────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)

    if (!name.trim()) {
      setServerError('Le nom du programme est obligatoire.')
      return
    }
    if (crmProvider === 'autre' && !crmAutre.trim()) {
      setServerError('Précisez le nom du CRM.')
      return
    }

    setSubmitting(true)

    // Étape 1 : sauvegarder le brief
    const briefResult = await createBrief({
      name,
      location,
      promoteur,
      lot_count: lotCount ? Number(lotCount) : null,
      has_brs: hasBrs,
      budget_google: Number(budgetGoogle) || 0,
      budget_meta: Number(budgetMeta) || 0,
      campaign_duration_days: campaignDuration ? Number(campaignDuration) : null,
      landing_page_url: lpNotReady ? '' : landingPageUrl,
      lp_not_ready: lpNotReady,
      lp_provider: lpProvider,
      crm_provider: crmProvider,
      crm_provider_autre: crmAutre,
      pixel_meta_status: pixelMetaStatus,
      google_ads_tracking_status: googleAdsTrackingStatus,
      ga4_status: ga4Status,
      facebook_access_status: facebookAccessStatus,
      gtm_status: gtmStatus,
      launch_date: launchDate,
      notes,
    })

    if (!briefResult.success || !briefResult.programId) {
      setSubmitting(false)
      setServerError(briefResult.error ?? 'Une erreur est survenue.')
      return
    }

    // Étape 1.5 : upload des visuels vers Supabase Storage
    if (visualFiles.length > 0) {
      const browserSupabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const uploaded: string[] = []
      for (const { file } of visualFiles) {
        const ext = file.name.split('.').pop() ?? 'jpg'
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const path = `${briefResult.programId}/${safeName}`

        const { error: uploadError } = await browserSupabase.storage
          .from('campaign-assets')
          .upload(path, file, { contentType: file.type, upsert: false })

        if (!uploadError) {
          const { data: { publicUrl } } = browserSupabase.storage
            .from('campaign-assets')
            .getPublicUrl(path)
          uploaded.push(publicUrl)
        } else {
          console.error('Upload visuel échoué:', uploadError.message)
        }
      }

      if (uploaded.length > 0) {
        await updateBriefVisuels(briefResult.programId, uploaded)
      }
    }

    setSubmitting(false)

    // Étape 2 : générer le plan média IA
    setGeneratingPlan(true)
    const planResult = await generateMediaPlan(briefResult.programId)
    setGeneratingPlan(false)

    if (!planResult.success) {
      console.error('Erreur génération plan:', planResult.error)
    }

    router.push(`/agency/programs/${briefResult.programId}`)
  }

  // ─── Écran de chargement IA ────────────────────────────────────────────────
  if (generatingPlan) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
          <Sparkles className="h-8 w-8 animate-pulse text-white" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900">Génération du plan média en cours...</h2>
          <p className="mt-2 text-sm text-slate-500">
            L&apos;IA analyse le brief et construit votre stratégie Google Ads + Meta Ads.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Cela prend généralement 10 à 20 secondes</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* En-tête */}
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Nouveau programme</h1>
          <p className="mt-1 text-sm text-slate-500">
            Remplissez le brief pour initialiser le programme et préparer la génération du plan média.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Section 1 : Informations programme ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations programme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nom du programme" htmlFor="name" required>
                  <input
                    id="name"
                    type="text"
                    placeholder="Ex. Résidence Galliéni"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputClass}
                  />
                </Field>

                <Field label="Ville" htmlFor="location">
                  <input
                    id="location"
                    type="text"
                    placeholder="Ex. Nanterre"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Promoteur" htmlFor="promoteur">
                  <input
                    id="promoteur"
                    type="text"
                    placeholder="Ex. Foncière Siba"
                    value={promoteur}
                    onChange={(e) => setPromoteur(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Nombre de lots total" htmlFor="lot_count">
                  <input
                    id="lot_count"
                    type="number"
                    min="0"
                    placeholder="Ex. 42"
                    value={lotCount}
                    onChange={(e) => setLotCount(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <ToggleField
                id="has_brs"
                label="Présence de lots BRS"
                description="Bail Réel Solidaire — déclenche une campagne séparée et un Lead Gen Volume sur Meta"
                value={hasBrs}
                onChange={setHasBrs}
              />
            </CardContent>
          </Card>

          {/* ── Section 2 : Budgets & planning ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budgets & planning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Budget Google Ads (€)" htmlFor="budget_google">
                  <input
                    id="budget_google"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Ex. 2000"
                    value={budgetGoogle}
                    onChange={(e) => setBudgetGoogle(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Budget Meta Ads (€)" htmlFor="budget_meta">
                  <input
                    id="budget_meta"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Ex. 3000"
                    value={budgetMeta}
                    onChange={(e) => setBudgetMeta(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Durée de la campagne (jours)" htmlFor="campaign_duration">
                  <input
                    id="campaign_duration"
                    type="number"
                    min="1"
                    placeholder="Ex. 90"
                    value={campaignDuration}
                    onChange={(e) => setCampaignDuration(e.target.value)}
                    className={inputClass}
                  />
                </Field>

                <Field label="Date de lancement souhaitée" htmlFor="launch_date">
                  <input
                    id="launch_date"
                    type="date"
                    value={launchDate}
                    onChange={(e) => setLaunchDate(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
            </CardContent>
          </Card>

          {/* ── Section 3 : Landing page & CRM ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Landing page & CRM</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="URL de la landing page" htmlFor="landing_page_url">
                <input
                  id="landing_page_url"
                  type="url"
                  placeholder="https://..."
                  value={landingPageUrl}
                  onChange={(e) => setLandingPageUrl(e.target.value)}
                  disabled={lpNotReady}
                  className={cn(
                    inputClass,
                    lpNotReady && 'cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                  )}
                />
              </Field>

              {/* Case à cocher LP pas encore prête */}
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={lpNotReady}
                  onChange={(e) => setLpNotReady(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                />
                <span className="text-slate-600">
                  La landing page n&apos;est pas encore prête
                </span>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Qui fournit la landing page ?" htmlFor="lp_provider">
                  <select
                    id="lp_provider"
                    value={lpProvider}
                    onChange={(e) => setLpProvider(e.target.value as BriefFormData['lp_provider'])}
                    className={selectClass}
                  >
                    <option value="agency">Agence Diffusez</option>
                    <option value="promoteur">Promoteur</option>
                    <option value="a_creer">À créer</option>
                  </select>
                </Field>

                <Field label="CRM du promoteur" htmlFor="crm_provider">
                  <select
                    id="crm_provider"
                    value={crmProvider}
                    onChange={(e) => setCrmProvider(e.target.value as BriefFormData['crm_provider'])}
                    className={selectClass}
                  >
                    <option value="aucun">Aucun</option>
                    <option value="unlatch">Unlatch</option>
                    <option value="adlead">Adlead</option>
                    <option value="google_sheets">Google Sheets</option>
                    <option value="autre">Autre</option>
                  </select>
                </Field>
              </div>

              {crmProvider === 'autre' && (
                <Field label="Préciser le nom du CRM" htmlFor="crm_autre">
                  <input
                    id="crm_autre"
                    type="text"
                    placeholder="Ex. Salesforce, Hubspot..."
                    value={crmAutre}
                    onChange={(e) => setCrmAutre(e.target.value)}
                    className={inputClass}
                    autoFocus
                  />
                </Field>
              )}
            </CardContent>
          </Card>

          {/* ── Section 4 : Accès & intégrations ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Accès & intégrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">

              {lpNotReady && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    La landing page n&apos;étant pas encore prête, tous les éléments de tracking ont été basculés sur &quot;À créer&quot; automatiquement.
                  </span>
                </div>
              )}

              {!lpNotReady && diffusezLP && (
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    La LP étant créée par Diffusez, le tracking sera à poser par l&apos;expert digital.
                    Le Pixel Meta, le Tracking Google Ads et GA4 ont été basculés sur &quot;À créer&quot; automatiquement.
                  </span>
                </div>
              )}

              <StatusField
                id="pixel_meta"
                label="Pixel Meta"
                value={pixelMetaStatus}
                onChange={setPixelMetaStatus}
                locked={allTrackingLocked || diffusezLP}
              />
              <StatusField
                id="google_ads_tracking"
                label="Tracking conversions Google Ads"
                value={googleAdsTrackingStatus}
                onChange={setGoogleAdsTrackingStatus}
                locked={allTrackingLocked || diffusezLP}
              />
              <StatusField
                id="ga4"
                label="Compte GA4"
                value={ga4Status}
                onChange={setGa4Status}
                locked={allTrackingLocked || diffusezLP}
              />
              <StatusField
                id="facebook_access"
                label="Accès page Facebook"
                value={facebookAccessStatus}
                onChange={setFacebookAccessStatus}
                locked={allTrackingLocked}
              />
              <StatusField
                id="gtm"
                label="Google Tag Manager sur la LP"
                value={gtmStatus}
                onChange={setGtmStatus}
                locked={allTrackingLocked}
              />
            </CardContent>
          </Card>

          {/* ── Section 5 : Notes libres ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes libres</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                id="notes"
                rows={4}
                placeholder="Contexte complémentaire, contraintes spécifiques, remarques..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={cn(inputClass, 'resize-none')}
              />
            </CardContent>
          </Card>

          {/* ── Section 6 : Visuels du programme ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visuels du programme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Zone drag & drop */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
                  dragOver
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white',
                  visualFiles.length >= MAX_IMAGES && 'pointer-events-none opacity-50'
                )}
              >
                <ImagePlus className={cn('h-8 w-8', dragOver ? 'text-blue-500' : 'text-slate-400')} />
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Déposez vos visuels ici ou{' '}
                    <span className="text-blue-600 underline underline-offset-2">cliquez pour sélectionner</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">JPG, PNG, WebP · Max 5 Mo par image · {visualFiles.length}/{MAX_IMAGES}</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                multiple
                className="hidden"
                onChange={handleFileInput}
              />

              {/* Erreur de validation */}
              {visualError && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {visualError}
                </div>
              )}

              {/* Grille de miniatures */}
              {visualFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {visualFiles.map((vf, i) => (
                    <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={vf.preview}
                        alt={vf.file.name}
                        className="h-full w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeVisual(i)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Supprimer ce visuel"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 truncate bg-black/40 px-1.5 py-0.5 text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {vf.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Erreur serveur */}
          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {serverError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pb-8">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting || generatingPlan}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || generatingPlan}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Enregistrement...' : 'Créer le programme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
