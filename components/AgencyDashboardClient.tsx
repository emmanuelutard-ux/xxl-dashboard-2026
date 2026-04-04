'use client'

import Link from 'next/link'

// Formatage de date sans dépendance à la locale du navigateur (évite l'hydratation mismatch)
function fmtDate(iso: string): string {
    const s = iso.slice(0, 10).split('-')
    return `${s[2]}/${s[1]}/${s[0]}`
}

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

export default function AgencyDashboardClient({ programs = [] }: { programs: AgencyProgramData[] }) {

    // Calculs (inchangés)
    const totalBudget = programs.reduce((acc, p) => acc + (p.total_budget || 0), 0)
    const totalLeads = 399
    const mediaInvested = 6714

    return (
        <div>
            {/* --- BLOC STATISTIQUES --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-slate-500 text-sm font-medium">Budget Total Géré</h3>
                        <span className="bg-blue-50 text-blue-600 p-2 rounded-lg">💼</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{totalBudget.toLocaleString('fr-FR')} €</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-slate-500 text-sm font-medium">Investissement Média</h3>
                        <span className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">📈</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{mediaInvested.toLocaleString('fr-FR')} €</p>
                    <p className="text-xs text-slate-400 mt-1">0% consommé</p>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-slate-500 text-sm font-medium">Performance Globale</h3>
                        <span className="bg-green-50 text-green-600 p-2 rounded-lg">🎯</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">{totalLeads} <span className="text-lg font-normal text-slate-500">Leads</span></p>
                    <p className="text-xs text-green-600 mt-1">◎ Objectifs atteints</p>
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
                        {programs.map((program) => (
                            <tr key={program.id} className="hover:bg-slate-50 transition-colors">

                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900">{program.name}</span>
                                        </div>

                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                                                program.status === 'brief'      ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                                program.status === 'validated'  ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                program.status === 'active'     ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                program.status === 'live'       ? 'bg-green-100 text-green-700 border-green-200' :
                                                program.status === 'paused'     ? 'bg-orange-100 text-orange-700 border-orange-200' :
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
                                    {program.start_date ? fmtDate(program.start_date) : 'N/C'} - <br />
                                    {program.end_date ? fmtDate(program.end_date) : 'N/C'}
                                </td>

                                <td className="px-6 py-4">
                                    <div className="text-sm">
                                        <span className="text-slate-400">Dépensé: 0 €</span>
                                        <span className="font-bold ml-2 text-slate-900">Total: {program.total_budget?.toLocaleString()} €</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <div className="text-lg font-bold text-slate-900">0</div>
                                            <div className="text-xs text-slate-500">Leads</div>
                                        </div>
                                        <div className="h-8 w-px bg-slate-200"></div>
                                        <div>
                                            <div className="text-lg font-bold text-slate-900">0.0 €</div>
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
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    )
}
