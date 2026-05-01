'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Settings2, X, Search, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createBrowserClient } from '@supabase/ssr'
import { listGoogleAdsCampaigns } from '@/app/actions/listGoogleAdsCampaigns'
import { linkGoogleAdsCampaigns } from '@/app/actions/linkGoogleAdsCampaigns'
import { listAvailableGoogleAdsAccounts } from '@/app/actions/listAvailableGoogleAdsAccounts'
import { linkGoogleAdsAccountToProgramme } from '@/app/actions/linkGoogleAdsAccountToProgramme'
import type { CampaignListResult } from '@/app/actions/listGoogleAdsCampaigns'
import type { AvailableAccount } from '@/app/actions/listAvailableGoogleAdsAccounts'

interface Account {
  id: string
  customer_id: string
  nom: string
}

type Campaign = NonNullable<CampaignListResult['campaigns']>[number]

const TYPE_LABELS: Record<string, string> = {
  SEARCH:          'Search',
  PERFORMANCE_MAX: 'Performance Max',
  DISPLAY:         'Display',
  VIDEO:           'Video',
  SHOPPING:        'Shopping',
  SMART:           'Smart',
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'ENABLED')
    return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Actif</span>
  if (status === 'PAUSED')
    return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">Pausé</span>
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{status}</span>
}

export default function ManageCampaignsModal({ programId }: { programId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  // ── Comptes liés (depuis Supabase) ────────────────────────────────────────
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  // ── Comptes disponibles via API (étape choix initial) ─────────────────────
  const [availableAccounts, setAvailableAccounts]   = useState<AvailableAccount[]>([])
  const [availableLoading, setAvailableLoading]     = useState(false)
  const [availableError, setAvailableError]         = useState<string | null>(null)
  const [linkingCustomerId, setLinkingCustomerId]   = useState<string | null>(null)
  const [linkingError, setLinkingError]             = useState<string | null>(null)

  // ── Campagnes ─────────────────────────────────────────────────────────────
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [campaignsError, setCampaignsError] = useState<string | null>(null)

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // ── Chargement à l'ouverture ──────────────────────────────────────────────
  // Séquentiel : d'abord les comptes liés, puis si vide → comptes disponibles via API
  useEffect(() => {
    if (!open) return

    async function loadAccounts() {
      setAccountsLoading(true)
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await supabase
        .from('google_ads_accounts')
        .select('id, customer_id, nom')
        .eq('programme_id', programId)
        .eq('is_active', true)

      const rows: Account[] = data ?? []
      setAccounts(rows)
      if (rows.length === 1) setSelectedAccount(rows[0])
      setAccountsLoading(false)

      // Aucun compte lié → charger les comptes accessibles via API
      if (rows.length === 0) {
        setAvailableLoading(true)
        setAvailableError(null)
        const result = await listAvailableGoogleAdsAccounts()
        setAvailableLoading(false)
        if (!result.success) {
          setAvailableError(result.error ?? 'Erreur inconnue')
        } else {
          setAvailableAccounts(result.accounts ?? [])
        }
      }
    }

    loadAccounts()
  }, [open, programId])

  // ── Chargement des campagnes quand un compte est sélectionné ──────────────
  useEffect(() => {
    if (!selectedAccount) return

    async function loadCampaigns() {
      setCampaignsLoading(true)
      setCampaignsError(null)
      setCampaigns([])

      const result = await listGoogleAdsCampaigns(selectedAccount!.customer_id, programId)
      setCampaignsLoading(false)

      if (!result.success || !result.campaigns) {
        setCampaignsError(result.error ?? 'Erreur inconnue')
        return
      }

      setCampaigns(result.campaigns)
      setCheckedIds(new Set(result.campaigns.filter((c) => c.is_linked).map((c) => c.campaign_id)))
    }

    loadCampaigns()
  }, [selectedAccount, programId])

  // ── Sélection d'un compte disponible (première liaison) ───────────────────
  async function handleSelectAvailableAccount(acc: AvailableAccount) {
    setLinkingCustomerId(acc.customer_id)
    setLinkingError(null)

    const result = await linkGoogleAdsAccountToProgramme(acc.customer_id, acc.nom, programId)
    setLinkingCustomerId(null)

    if (!result.success) {
      setLinkingError(result.error ?? 'Erreur inconnue')
      return
    }

    // Compte lié → passer à l'étape sélection de campagnes
    const linkedAccount: Account = {
      id:          result.account_id!,
      customer_id: acc.customer_id,
      nom:         acc.nom,
    }
    setAccounts([linkedAccount])
    setSelectedAccount(linkedAccount)
  }

  // ── Gestion des checkboxes ────────────────────────────────────────────────
  function toggle(campaignId: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(campaignId)) next.delete(campaignId)
      else next.add(campaignId)
      return next
    })
  }

  // ── Sauvegarde des campagnes ──────────────────────────────────────────────
  async function handleSave() {
    if (!selectedAccount) return
    setSaving(true)
    setSaveError(null)

    const selected = campaigns
      .filter((c) => checkedIds.has(c.campaign_id))
      .map((c) => ({ campaign_id: c.campaign_id, nom: c.nom, type: c.type }))

    const result = await linkGoogleAdsCampaigns(programId, selectedAccount.id, selected)
    setSaving(false)

    if (!result.success) {
      setSaveError(result.error ?? 'Erreur inconnue')
      return
    }

    setSaved(true)
    setTimeout(() => {
      handleClose()
      router.refresh()
    }, 1200)
  }

  // ── Reset complet ─────────────────────────────────────────────────────────
  function handleClose() {
    setOpen(false)
    setAccounts([])
    setSelectedAccount(null)
    setAvailableAccounts([])
    setAvailableLoading(false)
    setAvailableError(null)
    setLinkingCustomerId(null)
    setLinkingError(null)
    setCampaigns([])
    setCampaignsLoading(false)
    setCampaignsError(null)
    setCheckedIds(new Set())
    setFilter('')
    setSaveError(null)
    setSaved(false)
  }

  const filtered = campaigns.filter((c) =>
    c.nom.toLowerCase().includes(filter.toLowerCase())
  )

  const isAccountPickerMode = !accountsLoading && accounts.length === 0

  return (
    <>
      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors print:hidden"
      >
        <Settings2 className="h-4 w-4 text-blue-600" />
        Campagnes Google Ads
      </button>

      {/* Modale */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative mx-4 flex w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl" style={{ maxHeight: '85vh' }}>

            {/* En-tête */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Campagnes Google Ads</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {isAccountPickerMode
                    ? 'Associez un compte Google Ads à ce programme'
                    : 'Sélectionnez les campagnes à associer à ce programme'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Corps */}
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">

              {/* ── Chargement initial ── */}
              {accountsLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              )}

              {/* ── MODE : Choix d'un compte ── */}
              {isAccountPickerMode && (
                <>
                  {availableLoading && (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                      <span className="ml-2 text-sm text-slate-500">Chargement des comptes Google Ads…</span>
                    </div>
                  )}

                  {availableError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {availableError}
                    </div>
                  )}

                  {!availableLoading && !availableError && availableAccounts.length === 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center">
                      <Building2 className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                      <p className="text-sm text-slate-500">Aucun compte Google Ads accessible.</p>
                      <p className="mt-1 text-xs text-slate-400">Vérifiez vos accès via le MCC ({'{'}8667313568{'}'}).</p>
                    </div>
                  )}

                  {!availableLoading && availableAccounts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Choisir le compte à associer
                      </p>

                      {linkingError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          {linkingError}
                        </div>
                      )}

                      {availableAccounts.map((acc) => {
                        const isOtherProgramme = acc.is_linked && acc.linked_programme_id !== programId
                        const isLinking        = linkingCustomerId === acc.customer_id

                        return (
                          <button
                            key={acc.customer_id}
                            type="button"
                            disabled={isOtherProgramme || linkingCustomerId !== null}
                            onClick={() => handleSelectAvailableAccount(acc)}
                            className={cn(
                              'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                              isOtherProgramme
                                ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
                                : linkingCustomerId !== null && !isLinking
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
                                {isLinking && (
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                )}
                                {isOtherProgramme && (
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

              {/* ── MODE : Sélection des campagnes ── */}
              {!accountsLoading && accounts.length > 0 && (
                <>
                  {/* Sélecteur de compte (si plusieurs) */}
                  {accounts.length > 1 && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600">
                        Compte Google Ads
                      </label>
                      <select
                        value={selectedAccount?.id ?? ''}
                        onChange={(e) => {
                          const acc = accounts.find((a) => a.id === e.target.value) ?? null
                          setSelectedAccount(acc)
                        }}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">— Sélectionner un compte —</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.nom} ({a.customer_id})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Compte unique : bandeau informatif */}
                  {accounts.length === 1 && selectedAccount && (
                    <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                      <span className="text-xs font-medium text-blue-700">{selectedAccount.nom}</span>
                      <span className="text-xs text-blue-400">({selectedAccount.customer_id})</span>
                    </div>
                  )}

                  {/* Zone campagnes */}
                  {selectedAccount && (
                    <>
                      {campaignsLoading && (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                          <span className="ml-2 text-sm text-slate-500">Chargement des campagnes…</span>
                        </div>
                      )}

                      {campaignsError && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {campaignsError}
                        </div>
                      )}

                      {!campaignsLoading && !campaignsError && campaigns.length > 0 && (
                        <>
                          {/* Filtre */}
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Filtrer les campagnes…"
                              value={filter}
                              onChange={(e) => setFilter(e.target.value)}
                              className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          {/* Tableau */}
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
                                {filtered.map((c) => (
                                  <tr
                                    key={c.campaign_id}
                                    onClick={() => toggle(c.campaign_id)}
                                    className="cursor-pointer transition-colors hover:bg-slate-50"
                                  >
                                    <td className="px-4 py-3 text-center">
                                      <input
                                        type="checkbox"
                                        checked={checkedIds.has(c.campaign_id)}
                                        onChange={() => toggle(c.campaign_id)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      />
                                    </td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{c.nom}</td>
                                    <td className="px-4 py-3 text-slate-500">
                                      {TYPE_LABELS[c.type] ?? c.type}
                                    </td>
                                    <td className="px-4 py-3">
                                      <StatusBadge status={c.status} />
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                                      {c.daily_budget_eur !== null ? (
                                        `${c.daily_budget_eur.toLocaleString('fr-FR')} €`
                                      ) : (
                                        <span className="text-slate-400">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {filtered.length === 0 && (
                              <div className="py-8 text-center text-sm text-slate-400">
                                Aucune campagne ne correspond à votre recherche.
                              </div>
                            )}
                          </div>

                          <p className="text-xs text-slate-400">
                            {checkedIds.size} campagne{checkedIds.size !== 1 ? 's' : ''} sélectionnée{checkedIds.size !== 1 ? 's' : ''}
                          </p>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Pied de page — campagnes */}
            {!accountsLoading && accounts.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <div>
                  {saveError && <p className="text-xs text-red-600">{saveError}</p>}
                  {saved && (
                    <p className="text-xs font-medium text-green-600">
                      Liaisons enregistrées ✓
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={saving}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || !selectedAccount || saved}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Enregistrement…
                      </>
                    ) : (
                      'Enregistrer la sélection'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Pied de page — choix de compte */}
            {isAccountPickerMode && !availableLoading && (
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
