'use client'

import { useState, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Wallet, Target, Info } from 'lucide-react'

interface DailyMetric {
    date: string
    spend: number
    platform_conversions: number
    ga4_conversions: number
}

interface ClientProgramProps {
    program: {
        id: string
        name: string
        status: string
        total_budget: number
        conversion_source: 'platform' | 'ga4'
    }
    history: DailyMetric[]
}

// Fonction utilitaire pour agréger par semaine
function aggregateByWeek(data: DailyMetric[]) {
    const weeks: Record<string, DailyMetric> = {}

    data.forEach(metric => {
        const date = new Date(metric.date)
        // Trouver le lundi de la semaine
        const day = date.getDay()
        const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
        const monday = new Date(date.setDate(diff))
        const weekKey = monday.toISOString().split('T')[0]

        if (!weeks[weekKey]) {
            weeks[weekKey] = {
                date: weekKey,
                spend: 0,
                platform_conversions: 0,
                ga4_conversions: 0
            }
        }

        weeks[weekKey].spend += Number(metric.spend) || 0
        weeks[weekKey].platform_conversions += Number(metric.platform_conversions) || 0
        weeks[weekKey].ga4_conversions += Number(metric.ga4_conversions) || 0
    })

    return Object.values(weeks).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export default function ClientProgramCard({ program, history }: ClientProgramProps) {
    // Local state for visualization only - doesn't persist to DB
    const [viewSource, setViewSource] = useState<'platform' | 'ga4'>(program.conversion_source)

    // Aggrégations à la volée (Total global reste basé sur l'historique complet)
    const totalSpent = history.reduce((acc, day) => acc + (Number(day.spend) || 0), 0)

    const totalLeads = history.reduce((acc, day) => {
        const val = viewSource === 'ga4' ? day.ga4_conversions : day.platform_conversions
        return acc + (Number(val) || 0)
    }, 0)

    const budgetProgress = (program.total_budget > 0)
        ? Math.min((totalSpent / program.total_budget) * 100, 100)
        : 0

    // Données lissées pour le graph
    const chartData = useMemo(() => aggregateByWeek(history), [history])

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* HEADER */}
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-900">{program.name}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                            ${program.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {program.status}
                        </span>
                    </div>
                </div>

                {/* View Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-lg self-start">
                    <button
                        onClick={() => setViewSource('platform')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewSource === 'platform' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Ads Platform
                    </button>
                    <button
                        onClick={() => setViewSource('ga4')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewSource === 'ga4' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        GA4
                    </button>
                </div>
            </div>

            {/* CHART SECTION */}
            <div className="p-6 bg-slate-50/50">
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={viewSource === 'ga4' ? '#f97316' : '#3b82f6'} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={viewSource === 'ga4' ? '#f97316' : '#3b82f6'} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                stroke="#94a3b8"
                                tick={{ fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                minTickGap={30}
                            />
                            <YAxis yAxisId="left" orientation="left" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                labelFormatter={(label) => 'Semaine du ' + new Date(label).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                            />

                            {/* Area Dépenses */}
                            <Area
                                yAxisId="left"
                                type="monotone"
                                dataKey="spend"
                                name="Dépenses (€)"
                                stroke="#94a3b8"
                                fillOpacity={1}
                                fill="url(#colorSpend)"
                            />

                            {/* Area Leads */}
                            <Area
                                yAxisId="right"
                                type="monotone"
                                dataKey={viewSource === 'ga4' ? "ga4_conversions" : "platform_conversions"}
                                name={viewSource === 'ga4' ? "Leads GA4" : "Leads Platform"}
                                stroke={viewSource === 'ga4' ? '#f97316' : '#3b82f6'}
                                fillOpacity={1}
                                fill="url(#colorLeads)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* KPI & BUDGET FOOTER */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* KPI 1 */}
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-slate-100 rounded-xl text-slate-500">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Dépenses Totales</p>
                        <p className="text-2xl font-bold text-slate-900">{Math.round(totalSpent).toLocaleString()} €</p>
                    </div>
                </div>

                {/* KPI 2 */}
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${viewSource === 'ga4' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        <Target className="h-6 w-6" />
                    </div>
                    <div>
                        <p className={`text-sm font-medium ${viewSource === 'ga4' ? 'text-orange-600' : 'text-blue-600'}`}>
                            Leads ({viewSource === 'ga4' ? 'GA4' : 'Platform'})
                        </p>
                        <p className={`text-2xl font-bold ${viewSource === 'ga4' ? 'text-orange-900' : 'text-blue-900'}`}>{totalLeads}</p>
                    </div>
                </div>

                {/* BUDGET BAR */}
                <div className="md:border-l md:border-slate-100 md:pl-8">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-slate-700">Budget Consommé</span>
                        <span className="text-xs font-bold text-slate-500">{Math.round(budgetProgress)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-slate-800 rounded-full transition-all duration-1000"
                            style={{ width: `${budgetProgress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>{Math.round(totalSpent).toLocaleString()} € dépensés</span>
                        <span>sur {program.total_budget.toLocaleString()} €</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
