'use client'

import Link from 'next/link'

// ─── Utilitaires de formatage ─────────────────────────────────────────────────

// Évite toute dépendance à la locale du navigateur (hydratation stable)
function fmtEuro(n: number, decimals = 0): string {
    return n.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }) + ' €'
}

const MONTHS_FR = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
] as const

function fmtDateFr(iso: string): string {
    const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
    const d = day === 1 ? '1er' : String(day)
    return `${d} ${MONTHS_FR[month - 1]} ${year}`
}

function fmtDate(iso: string): string {
    const s = iso.slice(0, 10).split('-')
    return `${s[2]}/${s[1]}/${s[0]}`
}

// Calcule le nombre de jours entre deux dates ISO (UTC, sans DST)
function daysBetween(iso1: string, iso2: string): number {
    const [y1, m1, d1] = iso1.slice(0, 10).split('-').map(Number)
    const [y2, m2, d2] = iso2.slice(0, 10).split('-').map(Number)
    return (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000
}

// % du temps écoulé entre start et end, plafonné à 100, capped à 0 si dates manquantes
function calcPctTime(startDate: string | null, endDate: string | null, today: string): number {
    if (!startDate || !endDate) return 0
    const total   = daysBetween(startDate, endDate)
    if (total <= 0) return 100
    const elapsed = daysBetween(startDate, today)
    return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgencyProgramData {
    id: string
    name: string
    status: string
    total_budget: number
    start_date: string | null
    end_date: string | null
    metrics: {
        spent: number
        leads_platform: number
        leads_ga4: number
    }
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function AgencyDashboardClient({
    programs = [],
    periodStart,
    periodEnd,
}: {
    programs: AgencyProgramData[]
    periodStart: string
    periodEnd: string
}) {
    const totalBudget   = programs.reduce((acc, p) => acc + (p.total_budget || 0), 0)
    const totalInvested = programs.reduce((s, p) => s + (p.metrics?.spent ?? 0), 0)
    const totalLeads    = programs.reduce((s, p) => s + (p.metrics?.leads_platform ?? 0), 0)
    const totalCpl      = totalLeads > 0 ? totalInvested / totalLeads : null
    const pctConsumed   = totalBudget > 0 ? Math.round((totalInvested / totalBudget) * 100) : 0

    const totalCplColor = totalCpl === null
        ? 'text-slate-400'
        : totalCpl < 35 ? 'text-green-600' : 'text-orange-500'

    return (
        <div>
            {/* Bandeau période */}
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-500">
                <span>📅</span>
                <span>Période : du {fmtDateFr(periodStart)} au {fmtDateFr(periodEnd)}</span>
            </div>

            {/* --- BLOC STATISTIQUES --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-slate-500 text-sm font-medium">Budget Total Géré</h3>
                        <span className="bg-blue-50 text-blue-600 p-2 rounded-lg">💼</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{fmtEuro(totalBudget)}</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-slate-500 text-sm font-medium">Investissement Média</h3>
                        <span className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">📈</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{fmtEuro(totalInvested)}</p>
                    <p className="text-xs text-slate-400 mt-1">{pctConsumed}% consommé</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-slate-500 text-sm font-medium">Performance Globale</h3>
                        <span className="bg-green-50 text-green-600 p-2 rounded-lg">🎯</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                        {totalLeads} <span className="text-lg font-normal text-slate-500">Leads</span>
                    </p>
                    <p className={`text-xs mt-1 ${totalCplColor}`}>
                        {totalCpl !== null ? `CPL moyen : ${fmtEuro(totalCpl, 2)}` : '—'}
                    </p>
                </div>
            </div>

            {/* --- TABLEAU DES PROGRAMMES --- */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800">Portefeuille Programmes</h3>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-xs font-semibold text-slate-500 bg-slate-50 border-b border-slate-100">
                            <th className="px-6 py-4">PROGRAMME</th>
                            <th className="px-6 py-4">PÉRIODE</th>
                            <th className="px-6 py-4">BUDGET & ATTERRISSAGE</th>
                            <th className="px-6 py-4">PERFORMANCE</th>
                            <th className="px-6 py-4">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {programs.map((program) => {
                            const spent      = program.metrics?.spent ?? 0
                            const leads      = program.metrics?.leads_platform ?? 0
                            const cpl        = leads > 0 ? spent / leads : null
                            const pctBudget  = program.total_budget > 0
                                ? Math.min(100, (spent / program.total_budget) * 100)
                                : 0
                            const pctTimeVal = calcPctTime(program.start_date, program.end_date, periodEnd)
                            const ecart      = Math.abs(pctBudget - pctTimeVal)
                            const ecartColor = ecart <= 10
                                ? 'text-green-600'
                                : ecart <= 25 ? 'text-orange-500' : 'text-red-600'
                            const ecartLabel = ecart <= 10
                                ? '✓ OK'
                                : pctBudget < pctTimeVal ? '↘ Sous-conso' : '↗ Sur-conso'
                            const cplColor   = cpl === null
                                ? 'text-slate-400'
                                : cpl < 35 ? 'text-green-600' : 'text-orange-500'
                            const hasDates   = !!program.start_date && !!program.end_date

                            return (
                                <tr key={program.id} className="hover:bg-slate-50 transition-colors">

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900">{program.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                                                    program.status === 'brief'     ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                                    program.status === 'validated' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                    program.status === 'active'    ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                    program.status === 'live'      ? 'bg-green-100 text-green-700 border-green-200' :
                                                    program.status === 'paused'    ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                                                     'bg-slate-200 text-slate-600 border-slate-300'
                                                }`}>
                                                    {program.status === 'brief'     ? 'Brief en cours' :
                                                     program.status === 'validated' ? 'Plan validé' :
                                                     program.status === 'active'    ? 'Assets en cours' :
                                                     program.status === 'live'      ? 'Campagne active' :
                                                     program.status === 'paused'    ? 'En pause' :
                                                                                      'Archivé'}
                                                </span>
                                                <span className="text-xs text-slate-400 font-mono">ID: {program.id.slice(0, 4)}...</span>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {program.start_date ? fmtDate(program.start_date) : 'N/C'} -<br />
                                        {program.end_date ? fmtDate(program.end_date) : 'N/C'}
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <span className="font-semibold text-slate-800">{fmtEuro(spent)}</span>
                                            <span className="text-slate-400 ml-1">/ {fmtEuro(program.total_budget)}</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 mb-2">
                                            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${pctBudget}%` }} />
                                        </div>
                                        {hasDates && (
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                                                <span>⏱ {Math.round(pctTimeVal)}% du temps</span>
                                                <span>💰 {Math.round(pctBudget)}% du budget</span>
                                                <span className={`font-medium ${ecartColor}`}>
                                                    {ecartLabel} {ecart > 10 ? `${Math.round(ecart)} pts` : ''}
                                                </span>
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div>
                                                <div className="text-lg font-bold text-slate-900">{leads}</div>
                                                <div className="text-xs text-slate-500">Leads</div>
                                            </div>
                                            <div className="h-8 w-px bg-slate-200" />
                                            <div>
                                                <div className={`text-lg font-bold ${cplColor}`}>
                                                    {cpl !== null ? fmtEuro(cpl, 2) : '—'}
                                                </div>
                                                <div className="text-xs text-slate-500">CPL</div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/agency/programs/${program.id}`}
                                                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors border border-slate-200 px-3 py-2 rounded-lg hover:bg-white hover:border-blue-200 hover:shadow-sm bg-slate-50 whitespace-nowrap"
                                            >
                                                📋 Plan média
                                            </Link>
                                            <Link
                                                href={`/agency/programs/${program.id}/performances`}
                                                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-green-600 transition-colors border border-slate-200 px-3 py-2 rounded-lg hover:bg-white hover:border-green-200 hover:shadow-sm bg-slate-50 whitespace-nowrap"
                                            >
                                                📊 Performances
                                            </Link>
                                        </div>
                                    </td>

                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

        </div>
    )
}
