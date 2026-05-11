import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { KPI, ChannelPacingRow } from '@/components/ds'
import type { PacingStatus } from '@/components/ds'

export const dynamic = 'force-dynamic'

const PERIOD_START = '2026-01-01'

const WEEKDAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function getTimePct(startDate: string | null, endDate: string | null): number {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  const now = Date.now()
  if (now >= end) return 100
  if (now <= start) return 0
  return Math.round(((now - start) / (end - start)) * 100)
}

function getPacingStatus(timePct: number, budgetPct: number): PacingStatus {
  const delta = budgetPct - timePct
  if (delta > 15) return 'over'
  if (delta < -15) return 'under'
  return 'on-track'
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export default async function AgencyHomePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div className="p-8 text-sand-500">Accès refusé.</div>

  const [{ data: profile }, { data: programs }, { data: allMetrics }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    supabase
      .from('real_estate_programs')
      .select('id, name, status, budget_google, budget_meta, start_date, end_date, target_cpl, location')
      .neq('status', 'archived')
      .order('created_at', { ascending: false }),
    supabase
      .from('daily_ad_metrics')
      .select('program_id, date, platform, spend, platform_conversions')
      .gte('date', PERIOD_START),
  ])

  // Date display
  const now = new Date()
  const weekDay = WEEKDAYS_FR[now.getDay()]
  const day = now.getDate()
  const month = MONTHS_FR[now.getMonth()]
  const year = now.getFullYear()
  const breadcrumb = `${weekDay} ${day} ${month} ${year} · Semaine ${getWeekNumber(now)}`
  const periodLabel = `01 jan → ${day} ${month.slice(0, 4)}. ${year}`

  // User name
  const fullName = (profile as { full_name?: string } | null)?.full_name ?? ''
  const firstName = fullName.split(' ')[0] || 'Marine'

  // Aggregate metrics per program per channel
  type ChannelAgg = { spend: number; contacts: number }
  const metricsByProgram = new Map<string, { google: ChannelAgg; meta: ChannelAgg }>()

  for (const m of allMetrics ?? []) {
    if (!metricsByProgram.has(m.program_id)) {
      metricsByProgram.set(m.program_id, {
        google: { spend: 0, contacts: 0 },
        meta:   { spend: 0, contacts: 0 },
      })
    }
    const pm = metricsByProgram.get(m.program_id)!
    const ch = m.platform === 'google' ? pm.google : pm.meta
    ch.spend    += Number(m.spend) || 0
    ch.contacts += Number(m.platform_conversions) || 0
  }

  // Build enriched program rows
  const programData = (programs ?? []).map(p => {
    const pm          = metricsByProgram.get(p.id) ?? { google: { spend: 0, contacts: 0 }, meta: { spend: 0, contacts: 0 } }
    const timePct = getTimePct(p.start_date as string | null, p.end_date as string | null)
    const gBudget = Number(p.budget_google) || 0
    const mBudget = Number(p.budget_meta)   || 0

    const gBudgetPct = gBudget > 0 ? clamp(Math.round((pm.google.spend / gBudget) * 100), 0, 100) : 0
    const mBudgetPct = mBudget > 0 ? clamp(Math.round((pm.meta.spend   / mBudget) * 100), 0, 100) : 0

    const totalContacts = pm.google.contacts + pm.meta.contacts
    const totalSpend    = pm.google.spend    + pm.meta.spend
    const cpl           = totalContacts > 0 ? totalSpend / totalContacts : null

    return {
      id:           p.id as string,
      name:         p.name as string,
      status:       p.status as string,
      location:     (p.location as string | null) ?? null,
      timePct,
      google: {
        spend:      pm.google.spend,
        contacts:   pm.google.contacts,
        budgetPct:  gBudgetPct,
        status:     getPacingStatus(timePct, gBudgetPct),
        notActive:  pm.google.spend === 0 && pm.google.contacts === 0,
      },
      meta: {
        spend:      pm.meta.spend,
        contacts:   pm.meta.contacts,
        budgetPct:  mBudgetPct,
        status:     getPacingStatus(timePct, mBudgetPct),
        notActive:  pm.meta.spend === 0 && pm.meta.contacts === 0,
      },
      totalContacts,
      totalSpend,
      cpl,
      targetCpl: Number(p.target_cpl) > 0 ? Number(p.target_cpl) : null,
    }
  })

  // Portfolio KPIs — budget = sum(budget_google + budget_meta) per program
  const portfolioTotalBudget   = (programs ?? []).reduce((s, p) => s + (Number(p.budget_google) || 0) + (Number(p.budget_meta) || 0), 0)
  const portfolioTotalSpend    = programData.reduce((s, p) => s + p.totalSpend, 0)
  const portfolioTotalContacts = programData.reduce((s, p) => s + p.totalContacts, 0)
  const portfolioCPL           = portfolioTotalContacts > 0 ? portfolioTotalSpend / portfolioTotalContacts : null

  // Sparklines — last 7 calendar days
  const last7Dates: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    last7Dates.push(d.toISOString().split('T')[0])
  }
  const sevenDaysAgoStr = last7Dates[0]

  const spendByDay   = new Map<string, number>(last7Dates.map(d => [d, 0]))
  const contactByDay = new Map<string, number>(last7Dates.map(d => [d, 0]))
  for (const m of allMetrics ?? []) {
    if (m.date >= sevenDaysAgoStr) {
      spendByDay.set(m.date,   (spendByDay.get(m.date)   ?? 0) + (Number(m.spend)                || 0))
      contactByDay.set(m.date, (contactByDay.get(m.date) ?? 0) + (Number(m.platform_conversions) || 0))
    }
  }
  const spendSpark    = last7Dates.map(d => spendByDay.get(d)   ?? 0)
  const contactsSpark = last7Dates.map(d => contactByDay.get(d) ?? 0)

  // Cumulative CPL spark
  let cumS = 0, cumC = 0
  const cplSpark = last7Dates.map(d => {
    cumS += spendByDay.get(d)   ?? 0
    cumC += contactByDay.get(d) ?? 0
    return cumC > 0 ? Math.round(cumS / cumC) : 0
  })

  // Next best action — worst pacing among live programs
  const livePrograms = programData.filter(p => p.status === 'live')
  const bestAction = livePrograms.length > 0
    ? livePrograms.reduce((worst, p) => {
        const avgBudgetPct  = (p.google.budgetPct    + p.meta.budgetPct)    / 2
        const wAvgBudgetPct = (worst.google.budgetPct + worst.meta.budgetPct) / 2
        return (p.timePct - avgBudgetPct) > (worst.timePct - wAvgBudgetPct) ? p : worst
      })
    : null

  // Formatters
  const fmtEur    = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
  const fmtEurDec = (v: number) => v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

  const problemCount = programData.filter(
    p => p.google.status !== 'on-track' || p.meta.status !== 'on-track'
  ).length

  return (
    <div className="flex flex-col h-full">

      {/* ── TopBar ── */}
      <header className="flex items-center justify-between pl-14 pr-4 md:px-6 py-3.5 border-b border-sand-200 bg-white shrink-0">
        <div>
          <div className="text-xs text-sand-500 mb-0.5">{breadcrumb}</div>
          <div className="text-lg font-semibold text-sand-900">Bonjour {firstName}</div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sand-50 border border-sand-200 rounded-lg text-xs text-sand-700">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>
            </svg>
            {periodLabel}
          </div>
          <Link
            href="/agency/programs/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-ds-md bg-indigo-600 text-white border border-indigo-600 hover:bg-indigo-700 hover:border-indigo-700 transition-colors"
          >
            + Nouveau brief
          </Link>
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Next best action banner */}
        {bestAction && (
          <div
            className="flex items-center justify-between gap-4 rounded-ds-xl px-[18px] py-3.5 border border-[var(--terra-100)]"
            style={{ background: 'linear-gradient(135deg, var(--terra-50), var(--sand-50))' }}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 shrink-0 rounded-[10px] bg-terra-500 text-white grid place-items-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 22h20L12 2z"/><path d="M12 9v5M12 17h.01"/>
                </svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-sand-900">
                  {bestAction.name} sous-consomme — {bestAction.timePct}% du temps écoulé,{' '}
                  {Math.round((bestAction.google.budgetPct + bestAction.meta.budgetPct) / 2)}% du budget
                </div>
                <div className="text-xs text-sand-600 mt-0.5">
                  {bestAction.cpl
                    ? `CPL à ${fmtEurDec(bestAction.cpl)}${bestAction.targetCpl ? ` (cible ${fmtEur(bestAction.targetCpl)})` : ''}. `
                    : ''}
                  Prochaine action conseillée : revoir le ciblage.
                </div>
              </div>
            </div>
            <Link
              href={`/agency/programs/${bestAction.id}`}
              className="shrink-0 inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-ds-md bg-white text-sand-700 border border-sand-200 hover:bg-sand-100 transition-colors whitespace-nowrap"
            >
              Ouvrir {bestAction.name} →
            </Link>
          </div>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-4 gap-3">
          <KPI
            label="Budget géré"
            value={fmtEur(portfolioTotalBudget)}
            sub={`sur ${programData.length} programme${programData.length !== 1 ? 's' : ''}`}
            spark={spendSpark}
          />
          <KPI
            label="Investi à date"
            value={fmtEur(portfolioTotalSpend)}
            sub={
              portfolioTotalBudget > 0
                ? `${Math.round((portfolioTotalSpend / portfolioTotalBudget) * 100)}% du budget`
                : undefined
            }
            spark={spendSpark}
          />
          <KPI
            label="Contacts reçus"
            value={portfolioTotalContacts}
            sub={`+${contactsSpark[6] ?? 0} aujourd'hui`}
            tone="success"
            spark={contactsSpark}
          />
          <KPI
            label="CPL moyen"
            value={portfolioCPL !== null ? fmtEurDec(portfolioCPL) : '—'}
            sub="cible portefeuille 30 €"
            tone={
              portfolioCPL === null    ? 'default'  :
              portfolioCPL <= 30       ? 'success'  :
              portfolioCPL <= 50       ? 'warning'  : 'danger'
            }
            spark={cplSpark}
          />
        </div>

        {/* Programs table */}
        <div className="bg-white border border-sand-200 rounded-ds-xl overflow-hidden">
          <div className="flex items-center justify-between px-[18px] py-3.5 border-b border-sand-200">
            <div className="text-sm font-semibold text-sand-900">Portefeuille programmes</div>
            <div className="flex gap-1.5">
              <span className="text-xs px-2 py-1 rounded-lg bg-sand-100 border border-sand-200 text-sand-900 font-semibold">
                Tous · {programData.length}
              </span>
              {problemCount > 0 && (
                <span className="text-xs px-2 py-1 rounded-lg border border-transparent text-sand-500 font-medium">
                  À l'aide · {problemCount}
                </span>
              )}
            </div>
          </div>

          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-sand-50">
                <th className="text-left px-[18px] py-2.5 text-[11px] tracking-[0.08em] uppercase text-sand-500 font-semibold">
                  Programme
                </th>
                <th className="text-left px-3.5 py-2.5 text-[11px] tracking-[0.08em] uppercase text-sand-500 font-semibold">
                  Pacing
                </th>
                <th className="text-right px-3.5 py-2.5 text-[11px] tracking-[0.08em] uppercase text-sand-500 font-semibold">
                  Contacts
                </th>
                <th className="text-right px-3.5 py-2.5 text-[11px] tracking-[0.08em] uppercase text-sand-500 font-semibold">
                  CPL
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {programData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-[18px] py-10 text-center text-sand-400 text-sm">
                    Aucun programme actif
                  </td>
                </tr>
              ) : (
                programData.map(p => {
                  const cplGood = p.cpl !== null
                    ? p.targetCpl !== null ? p.cpl <= p.targetCpl * 1.1 : p.cpl <= 30
                    : true
                  return (
                    <tr key={p.id} className="border-t border-sand-100 hover:bg-sand-50/60 transition-colors">
                      <td className="px-[18px] py-3.5">
                        <div className="font-semibold text-sand-900">{p.name}</div>
                        {p.location && (
                          <div className="text-xs text-sand-500 mt-0.5">{p.location}</div>
                        )}
                      </td>
                      <td className="px-3.5 py-3 min-w-[240px]">
                        <div className="flex flex-col gap-[7px]">
                          <ChannelPacingRow
                            channel="google"
                            timePct={p.timePct}
                            budgetPct={p.google.budgetPct}
                            status={p.google.status as PacingStatus}
                            notActive={p.google.notActive}
                          />
                          <ChannelPacingRow
                            channel="meta"
                            timePct={p.timePct}
                            budgetPct={p.meta.budgetPct}
                            status={p.meta.status as PacingStatus}
                            notActive={p.meta.notActive}
                          />
                        </div>
                      </td>
                      <td className="px-3.5 py-3.5 text-right font-medium text-sand-900 tabular-nums">
                        {p.totalContacts}
                      </td>
                      <td className={[
                        'px-3.5 py-3.5 text-right font-semibold tabular-nums',
                        p.cpl !== null
                          ? cplGood ? 'text-emerald-700' : 'text-rose-700'
                          : 'text-sand-400',
                      ].join(' ')}>
                        {p.cpl !== null ? fmtEurDec(p.cpl) : '—'}
                      </td>
                      <td className="px-3.5 py-3.5 text-sand-400 text-base">
                        <Link
                          href={`/agency/programs/${p.id}`}
                          className="hover:text-sand-700 transition-colors"
                          aria-label={`Ouvrir ${p.name}`}
                        >
                          ›
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
