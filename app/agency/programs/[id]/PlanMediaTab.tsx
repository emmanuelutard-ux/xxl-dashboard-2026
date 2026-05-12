import { Sparkles, LayoutList } from 'lucide-react'
import { ChannelLogo } from '@/components/ds/ChannelLogo'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AiPlan {
  summary?:          string
  google_strategy?:  string
  meta_strategy?:    string
  expected_cpl?:     string
  timeline?:         string
  recommendations?:  string[]
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
  if (!p.summary && !p.google_strategy && !p.meta_strategy) return null
  return p
}

function fmtEur(n: number): string {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
}

function fmtDateFull(iso: string | null | undefined): string {
  if (!iso) return '—'
  const parts = iso.split('-')
  if (parts.length !== 3) return '—'
  const [y, m, d] = parts
  return `${d}/${m}/${y}`
}

function calcBudgetPerDay(
  budget: number,
  start:  string | null | undefined,
  end:    string | null | undefined,
): number | null {
  if (!budget || !start || !end) return null
  const days = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 86_400_000,
  )
  if (days <= 0) return null
  return Math.round(budget / days)
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

function PlatformCard({
  channel, name, active, budget, bpd, start, end, strategy, expectedCpl,
}: {
  channel:      'google' | 'meta'
  name:         string
  active:       boolean
  budget:       number
  bpd:          number | null
  start?:       string | null
  end?:         string | null
  strategy?:    string
  expectedCpl?: string
}) {
  if (!active) {
    return (
      <div className="rounded-[10px] border border-sand-100 bg-sand-50 p-5 flex flex-col items-center justify-center text-center gap-2 min-h-[180px]">
        <ChannelLogo channel={channel} size={24} />
        <p className="text-[12px] font-medium text-sand-500">{name}</p>
        <p className="text-[11px] text-sand-300">Non activé pour ce programme</p>
      </div>
    )
  }

  return (
    <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
      <div className="border-b border-sand-100 px-5 py-3.5 flex items-center gap-2.5">
        <ChannelLogo channel={channel} size={16} />
        <span className="text-[13px] font-semibold text-sand-900">{name}</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Budget + période */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.04em] mb-0.5">Budget total</p>
            <p className="text-[15px] font-semibold text-sand-900 tabular-nums leading-tight">
              {budget > 0 ? fmtEur(budget) : '—'}
            </p>
            {bpd !== null && (
              <p className="text-[11px] text-sand-400 tabular-nums mt-0.5">
                {fmtEur(bpd)} / jour
              </p>
            )}
          </div>
          <div>
            <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.04em] mb-0.5">Période</p>
            <p className="text-[12px] text-sand-700 tabular-nums leading-tight">
              {start ? fmtDateFull(start) : '—'}
            </p>
            {end && (
              <p className="text-[11px] text-sand-400 tabular-nums mt-0.5">
                → {fmtDateFull(end)}
              </p>
            )}
          </div>
        </div>

        {/* Stratégie */}
        {strategy && (
          <div>
            <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.04em] mb-1.5">
              Stratégie recommandée
            </p>
            <p className="text-[12px] text-sand-800 leading-relaxed">{strategy}</p>
          </div>
        )}

        {/* CPL estimé */}
        {expectedCpl && (
          <div className="rounded-ds-sm bg-indigo-50 border border-indigo-100 px-3 py-2 flex items-center gap-3">
            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-[0.04em]">CPL estimé</p>
            <p className="text-[13px] font-semibold text-emerald-700 tabular-nums">{expectedCpl}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function RecommendationsBlock({ items }: { items: string[] }) {
  return (
    <div className="rounded-[10px] border border-sand-200 bg-sand-50 p-5">
      <p className="text-[11px] font-semibold text-sand-500 uppercase tracking-[0.04em] mb-3">
        Recommandations IA
      </p>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <div className="mt-[5px] h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" />
            <p className="text-[12px] text-sand-800 leading-relaxed">{item}</p>
          </li>
        ))}
      </ul>
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

  const googleActive = briefData.google_active !== false
  const metaActive   = briefData.meta_active   !== false
  const googleStart  = briefData.google_start  as string | null | undefined
  const googleEnd    = briefData.google_end    as string | null | undefined
  const metaStart    = briefData.meta_start    as string | null | undefined
  const metaEnd      = briefData.meta_end      as string | null | undefined

  const gBpd = calcBudgetPerDay(budgetGoogle, googleStart, googleEnd)
  const mBpd = calcBudgetPerDay(budgetMeta,   metaStart,  metaEnd)
  const budgetTotal = budgetGoogle + budgetMeta

  return (
    <div className="space-y-5">

      {/* ── Bandeau IA ── */}
      <div className="rounded-[10px] border border-indigo-100 bg-indigo-50 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-indigo-800">Plan média généré par l&apos;IA</p>
            <p className="text-[11px] text-indigo-400 mt-0.5">Basé sur le brief programme</p>
          </div>
        </div>
        <button
          disabled
          className="px-3 py-1.5 text-xs font-medium rounded-ds-sm border border-indigo-200 bg-white text-indigo-400 opacity-60 cursor-not-allowed"
        >
          Régénérer
        </button>
      </div>

      {/* ── Synthèse stratégique ── */}
      {(plan.summary || plan.expected_cpl || plan.timeline) && (
        <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm p-5">
          <p className="text-[11px] font-semibold text-sand-400 uppercase tracking-[0.04em] mb-3">
            Synthèse stratégique
          </p>
          {plan.summary && (
            <p className="text-[13px] text-sand-800 leading-relaxed">{plan.summary}</p>
          )}
          {(plan.expected_cpl || plan.timeline) && (
            <div className="mt-4 flex items-center gap-6">
              {plan.expected_cpl && (
                <div>
                  <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.04em]">CPL estimé</p>
                  <p className="text-[14px] font-semibold text-emerald-700 tabular-nums mt-0.5">
                    {plan.expected_cpl}
                  </p>
                </div>
              )}
              {plan.timeline && (
                <div>
                  <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.04em]">Calendrier</p>
                  <p className="text-[13px] text-sand-800 mt-0.5">{plan.timeline}</p>
                </div>
              )}
              {hasBrs && (
                <div>
                  <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.04em]">Dispositif</p>
                  <p className="text-[12px] font-semibold text-indigo-600 mt-0.5">BRS inclus</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Répartition par régie ── */}
      <div className="grid grid-cols-2 gap-4">
        <PlatformCard
          channel="google"
          name="Google Ads"
          active={googleActive}
          budget={budgetGoogle}
          bpd={gBpd}
          start={googleStart}
          end={googleEnd}
          strategy={plan.google_strategy}
          expectedCpl={plan.expected_cpl}
        />
        <PlatformCard
          channel="meta"
          name="Meta Ads"
          active={metaActive}
          budget={budgetMeta}
          bpd={mBpd}
          start={metaStart}
          end={metaEnd}
          strategy={plan.meta_strategy}
          expectedCpl={plan.expected_cpl}
        />
      </div>

      {/* ── Récap budgets & timing ── */}
      <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
        <div className="border-b border-sand-100 px-5 py-3.5">
          <p className="text-[13px] font-semibold text-sand-900">Récap budgets & timing</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-sand-100 bg-sand-50">
                <th className="px-5 py-2.5 text-left   text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Régie</th>
                <th className="px-5 py-2.5 text-right  text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Budget total</th>
                <th className="px-5 py-2.5 text-right  text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Budget / jour</th>
                <th className="px-5 py-2.5 text-right  text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Date début</th>
                <th className="px-5 py-2.5 text-right  text-[11px] font-semibold text-sand-500 tracking-[0.04em]">Date fin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {([
                { ch: 'google' as const, label: 'Google Ads', active: googleActive, budget: budgetGoogle, bpd: gBpd, start: googleStart, end: googleEnd },
                { ch: 'meta'   as const, label: 'Meta Ads',   active: metaActive,   budget: budgetMeta,   bpd: mBpd, start: metaStart,   end: metaEnd   },
              ]).map(row => (
                <tr key={row.ch} className={row.active ? 'hover:bg-sand-50 transition-colors' : 'opacity-40'}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <ChannelLogo channel={row.ch} size={13} />
                      <span className="font-medium text-sand-900">{row.label}</span>
                      {!row.active && <span className="text-[10px] text-sand-400">non activé</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-sand-800 font-medium">
                    {row.budget > 0 ? fmtEur(row.budget) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-sand-700">
                    {row.bpd ? fmtEur(row.bpd) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-sand-700">
                    {fmtDateFull(row.start)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums text-sand-700">
                    {fmtDateFull(row.end)}
                  </td>
                </tr>
              ))}

              {/* Total */}
              {budgetTotal > 0 && (
                <tr className="bg-sand-50 border-t border-sand-200">
                  <td className="px-5 py-3 text-[12px] font-semibold text-sand-900">Total</td>
                  <td className="px-5 py-3 text-right tabular-nums text-[13px] font-bold text-sand-900">
                    {fmtEur(budgetTotal)}
                  </td>
                  <td colSpan={3} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Recommandations ── */}
      {plan.recommendations && plan.recommendations.length > 0 && (
        <RecommendationsBlock items={plan.recommendations} />
      )}

    </div>
  )
}
