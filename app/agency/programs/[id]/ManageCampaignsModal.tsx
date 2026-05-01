'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Settings2, X, Search, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createBrowserClient } from '@supabase/ssr'
import { listGoogleAdsCampaigns } from '@/app/actions/listGoogleAdsCampaigns'
import { linkGoogleAdsCampaigns } from '@/app/actions/linkGoogleAdsCampaigns'
import { listAvailableGoogleAdsAccounts } from '@/app/actions/listAvailableGoogleAdsAccounts'
import { linkGoogleAdsAccountToProgramme } from '@/app/actions/linkGoogleAdsAccountToProgramme'
import { listMetaAdAccounts } from '@/app/actions/listMetaAdAccounts'
import { linkMetaAccountToProgramme } from '@/app/actions/linkMetaAccountToProgramme'
import { listMetaCampaigns } from '@/app/actions/listMetaCampaigns'
import { linkMetaCampaigns } from '@/app/actions/linkMetaCampaigns'
import { getMetaAccountForProgramme } from '@/app/actions/getMetaAccountForProgramme'
import type { CampaignListResult } from '@/app/actions/listGoogleAdsCampaigns'
import type { AvailableAccount } from '@/app/actions/listAvailableGoogleAdsAccounts'
import type { MetaAdAccount } from '@/app/actions/listMetaAdAccounts'
import type { MetaCampaignListResult } from '@/app/actions/listMetaCampaigns'

// ─── Types locaux ─────────────────────────────────────────────────────────────

interface GoogleAccount {
  id: string
  customer_id: string
  nom: string
}

interface MetaAccount {
  id:            string   // uuid Supabase
  ad_account_id: string   // "act_XXX"
  name:          string
}

type GoogleCampaign = NonNullable<CampaignListResult['campaigns']>[number]
type MetaCampaign   = NonNullable<MetaCampaignListResult['campaigns']>[number]
type ActiveTab      = 'google' | 'meta'
type MetaStep       = 'choose-account' | 'choose-campaigns'

// ─── Helpers UI ───────────────────────────────────────────────────────────────

const GOOGLE_TYPE_LABELS: Record<string, string> = {
  SEARCH:          'Search',
  PERFORMANCE_MAX: 'Performance Max',
  DISPLAY:         'Display',
  VIDEO:           'Video',
  SHOPPING:        'Shopping',
  SMART:           'Smart',
}

const META_OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_LEADS:         'Leads',
  LEAD_GENERATION:       'Lead gen',
  OUTCOME_TRAFFIC:       'Trafic',
  OUTCOME_AWARENESS:     'Notoriété',
  OUTCOME_SALES:         'Ventes',
  OUTCOME_ENGAGEMENT:    'Engagement',
  OUTCOME_APP_PROMOTION: 'App',
}

function GoogleStatusBadge({ status }: { status: string }) {
  if (status === 'ENABLED')
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Actif</span>
  if (status === 'PAUSED')
    return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Pausé</span>
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{status}</span>
}

function MetaStatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE')
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Actif</span>
  if (status === 'PAUSED')
    return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Pausé</span>
  if (status === 'ARCHIVED')
    return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">Archivé</span>
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{status}</span>
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function ManageCampaignsModal({ programId }: { programId: string }) {
  const router = useRouter()
  const [open, setOpen]           = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('google')

  // ── Google : comptes liés (Supabase) ──────────────────────────────────────
  const [gAccounts, setGAccounts]               = useState<GoogleAccount[]>([])
  const [gAccountsLoading, setGAccountsLoading] = useState(false)
  const [gSelectedAccount, setGSelectedAccount] = useState<GoogleAccount | null>(null)

  // ── Google : comptes disponibles via API ──────────────────────────────────
  const [gAvailableAccounts, setGAvailableAccounts] = useState<AvailableAccount[]>([])
  const [gAvailableLoading, setGAvailableLoading]   = useState(false)
  const [gAvailableError, setGAvailableError]       = useState<string | null>(null)
  const [gLinkingId, setGLinkingId]                 = useState<string | null>(null)
  const [gLinkingError, setGLinkingError]           = useState<string | null>(null)

  // ── Google : campagnes ────────────────────────────────────────────────────
  const [gCampaigns, setGCampaigns]               = useState<GoogleCampaign[]>([])
  const [gCampaignsLoading, setGCampaignsLoading] = useState(false)
  const [gCampaignsError, setGCampaignsError]     = useState<string | null>(null)
  const [gCheckedIds, setGCheckedIds]             = useState<Set<string>>(new Set())
  const [gFilter, setGFilter]                     = useState('')

  // ── Google : sauvegarde ───────────────────────────────────────────────────
  const [gSaving, setGSaving]       = useState(false)
  const [gSaveError, setGSaveError] = useState<string | null>(null)
  const [gSaved, setGSaved]         = useState(false)

  // ── Meta : étape et comptes ───────────────────────────────────────────────
  const [metaStep, setMetaStep]                     = useState<MetaStep>('choose-account')
  const [metaAccountsLoading, setMetaAccountsLoading] = useState(false)
  const [metaAdAccounts, setMetaAdAccounts]         = useState<MetaAdAccount[]>([])
  const [metaAccountsError, setMetaAccountsError]   = useState<string | null>(null)
  const [metaLinkingId, setMetaLinkingId]           = useState<string | null>(null)
  const [metaLinkingError, setMetaLinkingError]     = useState<string | null>(null)
  const [metaSelectedAccount, setMetaSelectedAccount] = useState<MetaAccount | null>(null)

  // ── Meta : campagnes ──────────────────────────────────────────────────────
  const [metaCampaigns, setMetaCampaigns]               = useState<MetaCampaign[]>([])
  const [metaCampaignsLoading, setMetaCampaignsLoading] = useState(false)
  const [metaCampaignsError, setMetaCampaignsError]     = useState<string | null>(null)
  const [metaCheckedIds, setMetaCheckedIds]             = useState<Set<string>>(new Set())
  const [metaFilter, setMetaFilter]                     = useState('')

  // ── Meta : sauvegarde ─────────────────────────────────────────────────────
  const [metaSaving, setMetaSaving]       = useState(false)
  const [metaSaveError, setMetaSaveError] = useState<string | null>(null)
  const [metaSaved, setMetaSaved]         = useState(false)

  // Guard pour éviter de re-fetcher Meta quand on revient sur l'onglet
  const metaLoadedRef = useRef(false)

  // ── GOOGLE : chargement à l'ouverture ─────────────────────────────────────
  useEffect(() => {
    if (!open) return

    async function loadGoogleAccounts() {
      setGAccountsLoading(true)
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await supabase
        .from('google_ads_accounts')
        .select('id, customer_id, nom')
        .eq('programme_id', programId)
        .eq('is_active', true)

      const rows: GoogleAccount[] = data ?? []
      setGAccounts(rows)
      if (rows.length === 1) setGSelectedAccount(rows[0])
      setGAccountsLoading(false)

      if (rows.length === 0) {
        setGAvailableLoading(true)
        setGAvailableError(null)
        const result = await listAvailableGoogleAdsAccounts()
        setGAvailableLoading(false)
        if (!result.success) {
          setGAvailableError(result.error ?? 'Erreur inconnue')
        } else {
          setGAvailableAccounts(result.accounts ?? [])
        }
      }
    }

    loadGoogleAccounts()
  }, [open, programId])

  // ── GOOGLE : chargement des campagnes quand un compte est sélectionné ─────
  useEffect(() => {
    if (!gSelectedAccount) return

    async function loadGoogleCampaigns() {
      setGCampaignsLoading(true)
      setGCampaignsError(null)
      setGCampaigns([])

      const result = await listGoogleAdsCampaigns(gSelectedAccount!.customer_id, programId)
      setGCampaignsLoading(false)

      if (!result.success || !result.campaigns) {
        setGCampaignsError(result.error ?? 'Erreur inconnue')
        return
      }

      setGCampaigns(result.campaigns)
      setGCheckedIds(new Set(result.campaigns.filter((c) => c.is_linked).map((c) => c.campaign_id)))
    }

    loadGoogleCampaigns()
  }, [gSelectedAccount, programId])

  // ── META : chargement à l'activation de l'onglet ─────────────────────────
  useEffect(() => {
    if (!open) {
      metaLoadedRef.current = false
      return
    }
    if (activeTab !== 'meta') return
    if (metaLoadedRef.current) return
    metaLoadedRef.current = true

    async function loadMetaInitial() {
      setMetaAccountsLoading(true)
      setMetaAccountsError(null)

      // Vérifier si un compte est déjà lié à ce programme via meta_ads_campaigns
      const existing = await getMetaAccountForProgramme(programId)
      if (existing) {
        setMetaSelectedAccount(existing)
        setMetaStep('choose-campaigns')
        setMetaAccountsLoading(false)
        return
      }

      // Aucun compte lié → charger la liste des comptes accessibles
      const result = await listMetaAdAccounts()
      setMetaAccountsLoading(false)
      if (!result.success) {
        setMetaAccountsError(result.error ?? 'Erreur inconnue')
      } else {
        setMetaAdAccounts(result.accounts ?? [])
      }
    }

    loadMetaInitial()
  }, [open, activeTab, programId])

  // ── META : chargement des campagnes quand un compte est sélectionné ───────
  useEffect(() => {
    if (!metaSelectedAccount) return

    async function loadMetaCampaigns() {
      setMetaCampaignsLoading(true)
      setMetaCampaignsError(null)
      setMetaCampaigns([])

      const result = await listMetaCampaigns(metaSelectedAccount!.ad_account_id, programId)
      setMetaCampaignsLoading(false)

      if (!result.success || !result.campaigns) {
        setMetaCampaignsError(result.error ?? 'Erreur inconnue')
        return
      }

      setMetaCampaigns(result.campaigns)
      setMetaCheckedIds(new Set(result.campaigns.filter((c) => c.is_linked).map((c) => c.campaign_id)))
    }

    loadMetaCampaigns()
  }, [metaSelectedAccount, programId])

  // ── GOOGLE : sélection d'un compte disponible ─────────────────────────────
  async function handleSelectGoogleAccount(acc: AvailableAccount) {
    setGLinkingId(acc.customer_id)
    setGLinkingError(null)

    const result = await linkGoogleAdsAccountToProgramme(acc.customer_id, acc.nom, programId)
    setGLinkingId(null)

    if (!result.success) {
      setGLinkingError(result.error ?? 'Erreur inconnue')
      return
    }

    const linked: GoogleAccount = {
      id:          result.account_id!,
      customer_id: acc.customer_id,
      nom:         acc.nom,
    }
    setGAccounts([linked])
    setGSelectedAccount(linked)
  }

  // ── GOOGLE : toggle campagne ───────────────────────────────────────────────
  function toggleGoogle(campaignId: string) {
    setGCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(campaignId)) next.delete(campaignId)
      else next.add(campaignId)
      return next
    })
  }

  // ── GOOGLE : sauvegarde ───────────────────────────────────────────────────
  async function handleGoogleSave() {
    if (!gSelectedAccount) return
    setGSaving(true)
    setGSaveError(null)

    const selected = gCampaigns
      .filter((c) => gCheckedIds.has(c.campaign_id))
      .map((c) => ({ campaign_id: c.campaign_id, nom: c.nom, type: c.type }))

    const result = await linkGoogleAdsCampaigns(programId, gSelectedAccount.id, selected)
    setGSaving(false)

    if (!result.success) {
      setGSaveError(result.error ?? 'Erreur inconnue')
      return
    }

    setGSaved(true)
    setTimeout(() => { handleClose(); router.refresh() }, 1200)
  }

  // ── META : sélection d'un compte ──────────────────────────────────────────
  async function handleSelectMetaAccount(acc: MetaAdAccount) {
    setMetaLinkingId(acc.id)
    setMetaLinkingError(null)

    const result = await linkMetaAccountToProgramme(programId, acc.id, acc.name, acc.business_id)
    setMetaLinkingId(null)

    if (!result.success) {
      setMetaLinkingError(result.error ?? 'Erreur inconnue')
      return
    }

    const linked: MetaAccount = {
      id:            result.account_id!,
      ad_account_id: acc.id,
      name:          acc.name,
    }
    setMetaSelectedAccount(linked)
    setMetaStep('choose-campaigns')
  }

  // ── META : toggle campagne ────────────────────────────────────────────────
  function toggleMeta(campaignId: string) {
    setMetaCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(campaignId)) next.delete(campaignId)
      else next.add(campaignId)
      return next
    })
  }

  // ── META : sauvegarde ─────────────────────────────────────────────────────
  async function handleMetaSave() {
    if (!metaSelectedAccount) return
    setMetaSaving(true)
    setMetaSaveError(null)

    const selected = metaCampaigns
      .filter((c) => metaCheckedIds.has(c.campaign_id))
      .map((c) => ({ campaign_id: c.campaign_id, nom: c.nom, objective: c.objective }))

    const result = await linkMetaCampaigns(programId, metaSelectedAccount.id, selected)
    setMetaSaving(false)

    if (!result.success) {
      setMetaSaveError(result.error ?? 'Erreur inconnue')
      return
    }

    setMetaSaved(true)
    setTimeout(() => { handleClose(); router.refresh() }, 1200)
  }

  // ── Reset complet ─────────────────────────────────────────────────────────
  function handleClose() {
    setOpen(false)
    setActiveTab('google')

    // Google reset
    setGAccounts([])
    setGSelectedAccount(null)
    setGAvailableAccounts([])
    setGAvailableLoading(false)
    setGAvailableError(null)
    setGLinkingId(null)
    setGLinkingError(null)
    setGCampaigns([])
    setGCampaignsLoading(false)
    setGCampaignsError(null)
    setGCheckedIds(new Set())
    setGFilter('')
    setGSaveError(null)
    setGSaved(false)

    // Meta reset
    setMetaStep('choose-account')
    setMetaAccountsLoading(false)
    setMetaAdAccounts([])
    setMetaAccountsError(null)
    setMetaLinkingId(null)
    setMetaLinkingError(null)
    setMetaSelectedAccount(null)
    setMetaCampaigns([])
    setMetaCampaignsLoading(false)
    setMetaCampaignsError(null)
    setMetaCheckedIds(new Set())
    setMetaFilter('')
    setMetaSaveError(null)
    setMetaSaved(false)
  }

  // ── Dérivés ───────────────────────────────────────────────────────────────
  const gFiltered = gCampaigns.filter((c) =>
    c.nom.toLowerCase().includes(gFilter.toLowerCase())
  )
  const metaFiltered = metaCampaigns.filter((c) =>
    c.nom.toLowerCase().includes(metaFilter.toLowerCase())
  )

  const isGoogleAccountPicker = !gAccountsLoading && gAccounts.length === 0

  // ── Sous-titre de l'en-tête ───────────────────────────────────────────────
  const subtitle =
    activeTab === 'google'
      ? isGoogleAccountPicker
        ? 'Associez un compte Google Ads à ce programme'
        : 'Sélectionnez les campagnes Google Ads à associer'
      : metaStep === 'choose-account'
        ? 'Choisissez un compte publicitaire Meta'
        : 'Sélectionnez les campagnes Meta à associer'

  return (
    <>
      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors print:hidden"
      >
        <Settings2 className="h-4 w-4 text-blue-600" />
        Gérer les campagnes
      </button>

      {/* Modale */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative mx-4 flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl" style={{ maxHeight: '85vh' }}>

            {/* ── En-tête ── */}
            <div className="border-b border-slate-100 px-6 pt-4 pb-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Gérer les campagnes</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="ml-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* ── Onglets ── */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('google')}
                  className={cn(
                    'rounded-t-lg px-4 py-2 text-xs font-semibold transition-colors',
                    activeTab === 'google'
                      ? 'border border-b-0 border-slate-200 bg-white text-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  Google Ads
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('meta')}
                  className={cn(
                    'rounded-t-lg px-4 py-2 text-xs font-semibold transition-colors',
                    activeTab === 'meta'
                      ? 'border border-b-0 border-slate-200 bg-white text-indigo-600'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  Meta Ads
                </button>
              </div>
            </div>

            {/* ── Corps ── */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">

              {/* ════════════════════════════════════════
                  ONGLET GOOGLE ADS
              ════════════════════════════════════════ */}
              {activeTab === 'google' && (
                <>
                  {gAccountsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                  )}

                  {/* Mode : choix d'un compte Google */}
                  {isGoogleAccountPicker && (
                    <>
                      {gAvailableLoading && (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                          <span className="ml-2 text-sm text-slate-500">Chargement des comptes Google Ads…</span>
                        </div>
                      )}

                      {gAvailableError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {gAvailableError}
                        </div>
                      )}

                      {!gAvailableLoading && !gAvailableError && gAvailableAccounts.length === 0 && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center">
                          <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                          <p className="text-sm text-slate-500">Aucun compte Google Ads accessible.</p>
                          <p className="mt-1 text-xs text-slate-400">Vérifiez vos accès via le MCC (8667313568).</p>
                        </div>
                      )}

                      {!gAvailableLoading && gAvailableAccounts.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Choisir le compte à associer
                          </p>

                          {gLinkingError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                              {gLinkingError}
                            </div>
                          )}

                          {gAvailableAccounts.map((acc) => {
                            const isOther   = acc.is_linked && acc.linked_programme_id !== programId
                            const isLinking = gLinkingId === acc.customer_id

                            return (
                              <button
                                key={acc.customer_id}
                                type="button"
                                disabled={isOther || gLinkingId !== null}
                                onClick={() => handleSelectGoogleAccount(acc)}
                                className={cn(
                                  'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                                  isOther
                                    ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
                                    : gLinkingId !== null && !isLinking
                                      ? 'cursor-not-allowed border-slate-200 bg-white opacity-50'
                                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                                )}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-900">{acc.nom}</p>
                                    <p className="text-xs text-slate-400">{acc.customer_id}</p>
                                  </div>
                                  <div className="shrink-0">
                                    {isLinking && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                                    {isOther && (
                                      <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                                        Lié à {acc.linked_programme_name ?? 'un autre programme'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* Mode : sélection campagnes Google */}
                  {!gAccountsLoading && gAccounts.length > 0 && (
                    <>
                      {gAccounts.length > 1 && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-600">Compte Google Ads</label>
                          <select
                            value={gSelectedAccount?.id ?? ''}
                            onChange={(e) => setGSelectedAccount(gAccounts.find((a) => a.id === e.target.value) ?? null)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">— Sélectionner un compte —</option>
                            {gAccounts.map((a) => (
                              <option key={a.id} value={a.id}>{a.nom} ({a.customer_id})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {gAccounts.length === 1 && gSelectedAccount && (
                        <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                          <span className="text-xs font-medium text-blue-700">{gSelectedAccount.nom}</span>
                          <span className="text-xs text-blue-400">({gSelectedAccount.customer_id})</span>
                        </div>
                      )}

                      {gSelectedAccount && (
                        <>
                          {gCampaignsLoading && (
                            <div className="flex items-center justify-center py-10">
                              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                              <span className="ml-2 text-sm text-slate-500">Chargement des campagnes…</span>
                            </div>
                          )}

                          {gCampaignsError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                              {gCampaignsError}
                            </div>
                          )}

                          {!gCampaignsLoading && !gCampaignsError && gCampaigns.length > 0 && (
                            <>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="Filtrer les campagnes…"
                                  value={gFilter}
                                  onChange={(e) => setGFilter(e.target.value)}
                                  className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>

                              <div className="overflow-hidden rounded-lg border border-slate-200">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      <th className="w-10 px-4 py-2.5 text-center" />
                                      <th className="px-4 py-2.5 text-left">Campagne</th>
                                      <th className="px-4 py-2.5 text-left">Type</th>
                                      <th className="px-4 py-2.5 text-left">Statut</th>
                                      <th className="px-4 py-2.5 text-right">Budget/jour</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {gFiltered.map((c) => (
                                      <tr
                                        key={c.campaign_id}
                                        onClick={() => toggleGoogle(c.campaign_id)}
                                        className="cursor-pointer transition-colors hover:bg-slate-50"
                                      >
                                        <td className="px-4 py-3 text-center">
                                          <input
                                            type="checkbox"
                                            checked={gCheckedIds.has(c.campaign_id)}
                                            onChange={() => toggleGoogle(c.campaign_id)}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                          />
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">{c.nom}</td>
                                        <td className="px-4 py-3 text-slate-500">{GOOGLE_TYPE_LABELS[c.type] ?? c.type}</td>
                                        <td className="px-4 py-3"><GoogleStatusBadge status={c.status} /></td>
                                        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                                          {c.daily_budget_eur !== null
                                            ? `${c.daily_budget_eur.toLocaleString('fr-FR')} €`
                                            : <span className="text-slate-400">—</span>}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {gFiltered.length === 0 && (
                                  <div className="py-8 text-center text-sm text-slate-400">
                                    Aucune campagne ne correspond à votre recherche.
                                  </div>
                                )}
                              </div>

                              <p className="text-xs text-slate-400">
                                {gCheckedIds.size} campagne{gCheckedIds.size !== 1 ? 's' : ''} sélectionnée{gCheckedIds.size !== 1 ? 's' : ''}
                              </p>
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}

              {/* ════════════════════════════════════════
                  ONGLET META ADS
              ════════════════════════════════════════ */}
              {activeTab === 'meta' && (
                <>
                  {metaAccountsLoading && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                    </div>
                  )}

                  {/* Mode : choix d'un compte Meta */}
                  {!metaAccountsLoading && metaStep === 'choose-account' && (
                    <>
                      {metaAccountsError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {metaAccountsError}
                        </div>
                      )}

                      {!metaAccountsError && metaAdAccounts.length === 0 && (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center">
                          <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                          <p className="text-sm text-slate-500">Aucun compte publicitaire Meta accessible.</p>
                          <p className="mt-1 text-xs text-slate-400">Vérifiez votre connexion Meta dans les paramètres.</p>
                        </div>
                      )}

                      {metaAdAccounts.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Choisir le compte à associer
                          </p>

                          {metaLinkingError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                              {metaLinkingError}
                            </div>
                          )}

                          {metaAdAccounts.map((acc) => {
                            const isLinking = metaLinkingId === acc.id

                            return (
                              <button
                                key={acc.id}
                                type="button"
                                disabled={metaLinkingId !== null}
                                onClick={() => handleSelectMetaAccount(acc)}
                                className={cn(
                                  'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                                  metaLinkingId !== null && !isLinking
                                    ? 'cursor-not-allowed border-slate-200 bg-white opacity-50'
                                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                                )}
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-slate-900">{acc.name}</p>
                                    <p className="text-xs text-slate-400">
                                      {acc.id}
                                      {acc.business_name && ` · ${acc.business_name}`}
                                    </p>
                                  </div>
                                  <div className="shrink-0">
                                    {isLinking && <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />}
                                    {!isLinking && acc.is_existing && (
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                        Déjà importé
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}

                  {/* Mode : sélection campagnes Meta */}
                  {!metaAccountsLoading && metaStep === 'choose-campaigns' && (
                    <>
                      {metaSelectedAccount && (
                        <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
                          <span className="text-xs font-medium text-indigo-700">{metaSelectedAccount.name}</span>
                          <span className="text-xs text-indigo-400">({metaSelectedAccount.ad_account_id})</span>
                        </div>
                      )}

                      {metaCampaignsLoading && (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                          <span className="ml-2 text-sm text-slate-500">Chargement des campagnes…</span>
                        </div>
                      )}

                      {metaCampaignsError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {metaCampaignsError}
                        </div>
                      )}

                      {!metaCampaignsLoading && !metaCampaignsError && metaCampaigns.length > 0 && (
                        <>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Filtrer les campagnes…"
                              value={metaFilter}
                              onChange={(e) => setMetaFilter(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="overflow-hidden rounded-lg border border-slate-200">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                  <th className="w-10 px-4 py-2.5 text-center" />
                                  <th className="px-4 py-2.5 text-left">Campagne</th>
                                  <th className="px-4 py-2.5 text-left">Objectif</th>
                                  <th className="px-4 py-2.5 text-left">Statut</th>
                                  <th className="px-4 py-2.5 text-right">Budget/jour</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {metaFiltered.map((c) => (
                                  <tr
                                    key={c.campaign_id}
                                    onClick={() => toggleMeta(c.campaign_id)}
                                    className="cursor-pointer transition-colors hover:bg-slate-50"
                                  >
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={metaCheckedIds.has(c.campaign_id)}
                                        onChange={() => toggleMeta(c.campaign_id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                      />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{c.nom}</td>
                                    <td className="px-4 py-3 text-slate-500">
                                      {META_OBJECTIVE_LABELS[c.objective] ?? (c.objective || '—')}
                                    </td>
                                    <td className="px-4 py-3"><MetaStatusBadge status={c.status} /></td>
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                                      {c.daily_budget_eur !== null
                                        ? `${c.daily_budget_eur.toLocaleString('fr-FR')} €`
                                        : <span className="text-slate-400">—</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {metaFiltered.length === 0 && (
                              <div className="py-8 text-center text-sm text-slate-400">
                                Aucune campagne ne correspond à votre recherche.
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-slate-400">
                            {metaCheckedIds.size} campagne{metaCheckedIds.size !== 1 ? 's' : ''} sélectionnée{metaCheckedIds.size !== 1 ? 's' : ''}
                          </p>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* ── Pied de page — Google campagnes ── */}
            {activeTab === 'google' && !gAccountsLoading && gAccounts.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <div>
                  {gSaveError && <p className="text-xs text-red-600">{gSaveError}</p>}
                  {gSaved && <p className="text-xs font-medium text-green-600">Liaisons enregistrées ✓</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={gSaving}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleGoogleSave}
                    disabled={gSaving || !gSelectedAccount || gSaved}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {gSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…</> : 'Enregistrer la sélection'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Pied de page — Google choix de compte ── */}
            {activeTab === 'google' && isGoogleAccountPicker && !gAvailableLoading && (
              <div className="flex justify-end border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Fermer
                </button>
              </div>
            )}

            {/* ── Pied de page — Meta campagnes ── */}
            {activeTab === 'meta' && !metaAccountsLoading && metaStep === 'choose-campaigns' && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <div>
                  {metaSaveError && <p className="text-xs text-red-600">{metaSaveError}</p>}
                  {metaSaved && <p className="text-xs font-medium text-green-600">Liaisons enregistrées ✓</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={metaSaving}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleMetaSave}
                    disabled={metaSaving || !metaSelectedAccount || metaSaved}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {metaSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…</> : 'Enregistrer la sélection'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Pied de page — Meta choix de compte ── */}
            {activeTab === 'meta' && !metaAccountsLoading && metaStep === 'choose-account' && (
              <div className="flex justify-end border-t border-slate-100 px-6 py-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Fermer
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}
