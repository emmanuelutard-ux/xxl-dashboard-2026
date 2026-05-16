import { Sparkles, LayoutList, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { ChannelLogo } from '@/components/ds/ChannelLogo'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CampaignStructure {
  name?: string
  match_type?: string
  budget_share?: string
  keywords_examples?: string[]
}

interface Audience {
  name?: string
  targeting?: string
  budget_share?: string
  creative_format?: string
}

interface AiPlan {
  summary?: string
  positioning?: {
    primary_axis?: string
    key_message?: string
    avoid_messages?: string[]
  }
  google?: {
    enabled?: boolean
    budget?: number
    daily_budget?: number
    strategy?: string
    campaign_structure?: CampaignStructure[]
    negative_keywords?: string[]
    bidding_strategy?: string
    landing_page_recommendation?: string
    expected_cpl?: string
    expected_contacts?: string
  }
  meta?: {
    enabled?: boolean
    budget?: number
    daily_budget?: number
    strategy?: string
    objective?: string
    audiences?: Audience[]
    creative_recommendations?: string[]
    radius?: number
    radius_note?: string
    expected_cpl?: string
    expected_contacts?: string
  }
  timing_recommendation?: {
    phase_1?: string
    phase_2?: string
    phase_3?: string
  }
  risks_and_alerts?: string[]
  next_steps?: string[]
  // backward compat (plans créés avec l'ancienne structure plate)
  google_strategy?: string
  meta_strategy?: string
  expected_cpl?: string
  timeline?: string
}

interface PlanMediaTabProps {
  briefData:    Record<string, unknown> | null
  budgetGoogle: number
  budgetMeta:   number
  hasBrs:       boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safePlan(raw: unknown): AiPlan | null {
  if (!raw || typeof raw !== 'object') return null
  const p = raw as AiPlan
  if (!p.summary && !p.google && !p.meta && !p.google_strategy && !p.meta_strategy) return null
  return p
}

function fmtEur(n: number | null | undefined): string {
  if (!n) return '—'
  return Math.round(n).toLocaleString('fr-FR') + ' €'
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="rounded-[10px] border border-dashed border-sand-200 bg-white py-16 flex flex-col items-center text-center gap-3">
      <LayoutList className="h-8 w-8 text-sand-300" />
      <div>
        <p className="text-[13px] font-medium text-sand-600">Aucun plan média généré pour ce programme</p>
        <p className="mt-1 text-[12px] text-sand-400 max-w-xs mx-auto leading-relaxed">
          Les programmes créés depuis le brief flow incluront automatiquement un plan média IA.
        </p>
      </div>
      <button
        disabled
        className="mt-1 px-4 py-2 text-xs font-medium rounded-ds-sm border border-sand-200 text-sand-500 bg-white opacity-50 cursor-not-allowed"
      >
        Générer un plan média
      </button>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm">
      <div className="border-b border-sand-100 px-5 py-3.5">
        <p className="text-[13px] font-semibold text-sand-900">{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.04em] mb-1.5">{children}</p>
}

function GoogleBlock({ plan, budgetGoogle }: { plan: AiPlan; budgetGoogle: number }) {
  const g = plan.google
  const strategy = g?.strategy ?? plan.google_strategy
  const enabled  = g?.enabled !== false
  const budget   = g?.budget ?? (enabled ? budgetGoogle : 0)

  if (!enabled) {
    return (
      <div className="rounded-[10px] border border-sand-100 bg-sand-50 p-5 flex flex-col items-center justify-center text-center gap-2 min-h-[120px]">
        <ChannelLogo channel="google" size={20} />
        <p className="text-[12px] text-sand-400">Google Ads non activé pour ce programme</p>
      </div>
    )
  }

  return (
    <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-sand-100 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ChannelLogo channel="google" size={16} />
          <span className="text-[13px] font-semibold text-sand-900">Google Ads</span>
        </div>
        <div className="flex items-center gap-4 text-right">
          {budget > 0 && (
            <div>
              <p className="text-[10px] text-sand-400 uppercase tracking-[0.04em]">Budget</p>
              <p className="text-[13px] font-semibold text-sand-900 tabular-nums">{fmtEur(budget)}</p>
            </div>
          )}
          {g?.daily_budget && (
            <div>
              <p className="text-[10px] text-sand-400 uppercase tracking-[0.04em]">/ jour</p>
              <p className="text-[13px] font-semibold text-sand-900 tabular-nums">{fmtEur(g.daily_budget)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {strategy && (
          <div>
            <FieldLabel>Stratégie</FieldLabel>
            <p className="text-[12px] text-sand-800 leading-relaxed">{strategy}</p>
          </div>
        )}

        {/* Structure de campagnes */}
        {g?.campaign_structure && g.campaign_structure.length > 0 && (
          <div>
            <FieldLabel>Structure de campagnes</FieldLabel>
            <div className="space-y-2.5">
              {g.campaign_structure.map((c, i) => (
                <div key={i} className="rounded-ds-sm border border-sand-200 bg-sand-50 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[12px] font-semibold text-sand-900">{c.name}</p>
                    {c.budget_share && (
                      <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-ds-full px-2 py-0.5">
                        {c.budget_share}
                      </span>
                    )}
                  </div>
                  {c.match_type && (
                    <p className="text-[11px] text-sand-500 mb-1.5">{c.match_type}</p>
                  )}
                  {c.keywords_examples && c.keywords_examples.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {c.keywords_examples.map((kw, j) => (
                        <span key={j} className="text-[10px] bg-white border border-sand-200 text-sand-700 rounded-ds-full px-2 py-0.5 font-mono">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mots-clés négatifs */}
        {g?.negative_keywords && g.negative_keywords.length > 0 && (
          <div>
            <FieldLabel>Mots-clés négatifs obligatoires</FieldLabel>
            <div className="flex flex-wrap gap-1.5">
              {g.negative_keywords.map((kw, i) => (
                <span key={i} className="text-[10px] bg-sand-100 border border-sand-200 text-sand-600 rounded-ds-full px-2 py-0.5">
                  −{kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Enchères */}
        {g?.bidding_strategy && (
          <div>
            <FieldLabel>Stratégie d&apos;enchères</FieldLabel>
            <p className="text-[12px] text-sand-800">{g.bidding_strategy}</p>
          </div>
        )}

        {/* Landing page */}
        {g?.landing_page_recommendation && (
          <div className="rounded-ds-sm bg-indigo-50 border border-indigo-100 p-3">
            <FieldLabel>Landing page</FieldLabel>
            <p className="text-[12px] text-indigo-800 leading-relaxed">{g.landing_page_recommendation}</p>
          </div>
        )}

        {/* KPI attendus */}
        {(g?.expected_cpl || g?.expected_contacts) && (
          <div className="grid grid-cols-2 gap-3">
            {g?.expected_cpl && (
              <div className="rounded-ds-sm bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                <FieldLabel>CPL estimé</FieldLabel>
                <p className="text-[14px] font-semibold text-emerald-700 tabular-nums">{g.expected_cpl}</p>
              </div>
            )}
            {g?.expected_contacts && (
              <div className="rounded-ds-sm bg-sand-50 border border-sand-200 px-3 py-2.5">
                <FieldLabel>Contacts attendus</FieldLabel>
                <p className="text-[13px] font-semibold text-sand-800">{g.expected_contacts}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MetaBlock({ plan, budgetMeta }: { plan: AiPlan; budgetMeta: number }) {
  const m = plan.meta
  const strategy = m?.strategy ?? plan.meta_strategy
  const enabled  = m?.enabled !== false
  const budget   = m?.budget ?? (enabled ? budgetMeta : 0)

  if (!enabled) {
    return (
      <div className="rounded-[10px] border border-sand-100 bg-sand-50 p-5 flex flex-col items-center justify-center text-center gap-2 min-h-[120px]">
        <ChannelLogo channel="meta" size={20} />
        <p className="text-[12px] text-sand-400">Meta Ads non activé pour ce programme</p>
      </div>
    )
  }

  return (
    <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-sand-100 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ChannelLogo channel="meta" size={16} />
          <span className="text-[13px] font-semibold text-sand-900">Meta Ads</span>
        </div>
        <div className="flex items-center gap-4 text-right">
          {budget > 0 && (
            <div>
              <p className="text-[10px] text-sand-400 uppercase tracking-[0.04em]">Budget</p>
              <p className="text-[13px] font-semibold text-sand-900 tabular-nums">{fmtEur(budget)}</p>
            </div>
          )}
          {m?.daily_budget && (
            <div>
              <p className="text-[10px] text-sand-400 uppercase tracking-[0.04em]">/ jour</p>
              <p className="text-[13px] font-semibold text-sand-900 tabular-nums">{fmtEur(m.daily_budget)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Objectif */}
        {m?.objective && (
          <div className="rounded-ds-sm bg-indigo-50 border border-indigo-100 px-3 py-2 inline-block">
            <p className="text-[11px] font-semibold text-indigo-700">{m.objective}</p>
          </div>
        )}

        {strategy && (
          <div>
            <FieldLabel>Stratégie</FieldLabel>
            <p className="text-[12px] text-sand-800 leading-relaxed">{strategy}</p>
          </div>
        )}

        {/* Audiences */}
        {m?.audiences && m.audiences.length > 0 && (
          <div>
            <FieldLabel>Audiences</FieldLabel>
            <div className="space-y-2.5">
              {m.audiences.map((a, i) => (
                <div key={i} className="rounded-ds-sm border border-sand-200 bg-sand-50 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[12px] font-semibold text-sand-900">{a.name}</p>
                    {a.budget_share && (
                      <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-ds-full px-2 py-0.5">
                        {a.budget_share}
                      </span>
                    )}
                  </div>
                  {a.targeting && (
                    <p className="text-[11px] text-sand-600 leading-relaxed mb-1.5">{a.targeting}</p>
                  )}
                  {a.creative_format && (
                    <span className="text-[10px] bg-white border border-sand-200 text-sand-600 rounded-ds-full px-2 py-0.5">
                      {a.creative_format}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommandations créatives */}
        {m?.creative_recommendations && m.creative_recommendations.length > 0 && (
          <div>
            <FieldLabel>Recommandations créatives</FieldLabel>
            <ul className="space-y-1.5">
              {m.creative_recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] text-sand-800">
                  <div className="mt-[5px] h-1.5 w-1.5 rounded-full bg-terra-500 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rayon géo */}
        {m?.radius && (
          <div className="rounded-ds-sm bg-amber-50 border border-amber-100 px-3 py-2">
            <p className="text-[11px] text-amber-700">
              <span className="font-semibold">Rayon géo : {m.radius} km</span>
              {m.radius_note && ` — ${m.radius_note}`}
            </p>
          </div>
        )}

        {/* KPI attendus */}
        {(m?.expected_cpl || m?.expected_contacts) && (
          <div className="grid grid-cols-2 gap-3">
            {m?.expected_cpl && (
              <div className="rounded-ds-sm bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                <FieldLabel>CPL estimé</FieldLabel>
                <p className="text-[14px] font-semibold text-emerald-700 tabular-nums">{m.expected_cpl}</p>
              </div>
            )}
            {m?.expected_contacts && (
              <div className="rounded-ds-sm bg-sand-50 border border-sand-200 px-3 py-2.5">
                <FieldLabel>Contacts attendus</FieldLabel>
                <p className="text-[13px] font-semibold text-sand-800">{m.expected_contacts}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PlanMediaTab({
  briefData,
  budgetGoogle,
  budgetMeta,
  hasBrs,
}: PlanMediaTabProps) {
  if (!briefData) return <EmptyState />

  const plan = safePlan(briefData.ai_plan)
  if (!plan)   return <EmptyState />

  const phases = [
    { label: 'Mois 1–2', text: plan.timing_recommendation?.phase_1, color: 'bg-sand-200' },
    { label: 'Mois 2–3', text: plan.timing_recommendation?.phase_2, color: 'bg-indigo-200' },
    { label: 'Mois 3+',  text: plan.timing_recommendation?.phase_3, color: 'bg-emerald-200' },
  ].filter(p => p.text)

  return (
    <div className="space-y-5">

      {/* ── Bandeau IA ── */}
      <div className="rounded-[10px] border border-indigo-100 bg-indigo-50 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-indigo-800">Plan média généré par l&apos;IA</p>
            <p className="text-[11px] text-indigo-400 mt-0.5">Basé sur le brief programme — stratégie XXL</p>
          </div>
        </div>
        <button disabled className="px-3 py-1.5 text-xs font-medium rounded-ds-sm border border-indigo-200 bg-white text-indigo-400 opacity-60 cursor-not-allowed">
          Régénérer
        </button>
      </div>

      {/* ── Synthèse ── */}
      {plan.summary && (
        <SectionCard title="Synthèse stratégique">
          <p className="text-[13px] text-sand-800 leading-relaxed">{plan.summary}</p>
        </SectionCard>
      )}

      {/* ── Positionnement ── */}
      {plan.positioning && (
        <div className="rounded-[10px] border border-indigo-200 bg-indigo-50 p-5 space-y-4">
          <p className="text-[11px] font-semibold text-indigo-500 uppercase tracking-[0.04em]">Positionnement</p>
          {plan.positioning.primary_axis && (
            <div>
              <FieldLabel>Axe principal</FieldLabel>
              <p className="text-[13px] font-semibold text-indigo-800">{plan.positioning.primary_axis}</p>
            </div>
          )}
          {plan.positioning.key_message && (
            <div>
              <FieldLabel>Message clé</FieldLabel>
              <p className="text-[15px] font-semibold text-indigo-900 leading-tight">&ldquo;{plan.positioning.key_message}&rdquo;</p>
            </div>
          )}
          {plan.positioning.avoid_messages && plan.positioning.avoid_messages.length > 0 && (
            <div>
              <FieldLabel>À éviter</FieldLabel>
              <ul className="space-y-1">
                {plan.positioning.avoid_messages.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-indigo-700">
                    <span className="mt-[3px] text-indigo-400 shrink-0">—</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Répartition par régie ── */}
      <div className="grid grid-cols-2 gap-4">
        <GoogleBlock plan={plan} budgetGoogle={budgetGoogle} />
        <MetaBlock   plan={plan} budgetMeta={budgetMeta}     />
      </div>

      {/* ── Tableau récap ── */}
      {(budgetGoogle > 0 || budgetMeta > 0) && (
        <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
          <div className="border-b border-sand-100 px-5 py-3.5">
            <p className="text-[13px] font-semibold text-sand-900">Récap budgets & timing</p>
          </div>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-sand-100 bg-sand-50">
                {['Régie', 'Budget total', 'Budget / jour', 'Date début', 'Date fin'].map(h => (
                  <th key={h} className={`px-5 py-2.5 text-[11px] font-semibold text-sand-500 tracking-[0.04em] ${h === 'Régie' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {([
                {
                  ch: 'google' as const, label: 'Google Ads',
                  active: plan.google?.enabled !== false,
                  budget: plan.google?.budget ?? budgetGoogle,
                  bpd: plan.google?.daily_budget,
                  start: briefData.google_start as string | null | undefined,
                  end:   briefData.google_end   as string | null | undefined,
                },
                {
                  ch: 'meta' as const, label: 'Meta Ads',
                  active: plan.meta?.enabled !== false,
                  budget: plan.meta?.budget ?? budgetMeta,
                  bpd: plan.meta?.daily_budget,
                  start: briefData.meta_start as string | null | undefined,
                  end:   briefData.meta_end   as string | null | undefined,
                },
              ]).map(row => (
                <tr key={row.ch} className={row.active ? 'hover:bg-sand-50 transition-colors' : 'opacity-40'}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <ChannelLogo channel={row.ch} size={13} />
                      <span className="font-medium text-sand-900">{row.label}</span>
                      {!row.active && <span className="text-[10px] text-sand-400">non activé</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-sand-800 font-medium">{fmtEur(row.budget)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-sand-700">{fmtEur(row.bpd)}</td>
                  <td className="px-5 py-3 text-right tabular-nums text-sand-700">
                    {row.start ? row.start.split('-').reverse().join('/') : '—'}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-sand-700">
                    {row.end ? row.end.split('-').reverse().join('/') : '—'}
                  </td>
                </tr>
              ))}
              {(budgetGoogle + budgetMeta) > 0 && (
                <tr className="bg-sand-50 border-t border-sand-200">
                  <td className="px-5 py-3 text-[12px] font-semibold text-sand-900">Total</td>
                  <td className="px-5 py-3 text-right tabular-nums text-[13px] font-bold text-sand-900">
                    {fmtEur(budgetGoogle + budgetMeta)}
                  </td>
                  <td colSpan={3} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Calendrier d'optimisation ── */}
      {phases.length > 0 && (
        <SectionCard title="Calendrier d'optimisation">
          <div className="space-y-3">
            {phases.map((p, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`h-6 w-6 rounded-full ${p.color} flex items-center justify-center shrink-0`}>
                    <Clock className="h-3 w-3 text-sand-700" />
                  </div>
                  {i < phases.length - 1 && <div className="w-px flex-1 bg-sand-200 my-1" />}
                </div>
                <div className="pb-3">
                  <p className="text-[11px] font-semibold text-sand-500 uppercase tracking-[0.04em] mb-0.5">{p.label}</p>
                  <p className="text-[12px] text-sand-800 leading-relaxed">{p.text}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Risques et alertes ── */}
      {plan.risks_and_alerts && plan.risks_and_alerts.length > 0 && (
        <div className="rounded-[10px] border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-[12px] font-semibold text-amber-800">Risques et alertes</p>
          </div>
          <ul className="space-y-2">
            {plan.risks_and_alerts.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-amber-800 leading-relaxed">
                <span className="mt-[3px] text-amber-400 shrink-0">·</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Prochaines actions ── */}
      {plan.next_steps && plan.next_steps.length > 0 && (
        <div className="rounded-[10px] border border-emerald-100 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <p className="text-[12px] font-semibold text-emerald-800">Prochaines actions</p>
          </div>
          <ul className="space-y-2">
            {plan.next_steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[12px] text-emerald-800 leading-relaxed">
                <div className="mt-[4px] h-4 w-4 rounded-full border border-emerald-200 bg-white flex items-center justify-center shrink-0">
                  <span className="text-[9px] font-bold text-emerald-500">{i + 1}</span>
                </div>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Fallback ancienne structure ── */}
      {!plan.google && !plan.meta && plan.google_strategy && (
        <SectionCard title="Stratégie campagnes">
          {plan.google_strategy && (
            <div>
              <FieldLabel>Google Ads</FieldLabel>
              <p className="text-[12px] text-sand-800 leading-relaxed">{plan.google_strategy}</p>
            </div>
          )}
          {plan.meta_strategy && (
            <div>
              <FieldLabel>Meta Ads</FieldLabel>
              <p className="text-[12px] text-sand-800 leading-relaxed">{plan.meta_strategy}</p>
            </div>
          )}
        </SectionCard>
      )}

    </div>
  )
}
