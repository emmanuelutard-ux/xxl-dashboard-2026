'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Settings2, X, Search } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { listGoogleAdsCampaigns } from '@/app/actions/listGoogleAdsCampaigns'
import { linkGoogleAdsCampaigns } from '@/app/actions/linkGoogleAdsCampaigns'
import type { CampaignListResult } from '@/app/actions/listGoogleAdsCampaigns'

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

  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(false)
  const [campaignsError, setCampaignsError] = useState<string | null>(null)

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Charger les comptes ads liés au programme à l'ouverture
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
    }

    loadAccounts()
  }, [open, programId])

  // Charger les campagnes quand un compte est sélectionné
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

  function toggle(campaignId: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(campaignId)) next.delete(campaignId)
      else next.add(campaignId)
      return next
    })
  }

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

  function handleClose() {
    setOpen(false)
    setAccounts([])
    setSelectedAccount(null)
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
                  Sélectionnez les campagnes à associer à ce programme
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

              {accountsLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              )}

              {!accountsLoading && accounts.length === 0 && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center">
                  <p className="text-sm text-slate-500">
                    Aucun compte Google Ads associé à ce programme.
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Contactez l&apos;administrateur pour configurer la liaison.
                  </p>
                </div>
              )}

              {/* Sélecteur de compte (si plusieurs) */}
              {!accountsLoading && accounts.length > 1 && (
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
              {!accountsLoading && accounts.length === 1 && selectedAccount && (
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
            </div>

            {/* Pied de page */}
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
          </div>
        </div>
      )}
    </>
  )
}
