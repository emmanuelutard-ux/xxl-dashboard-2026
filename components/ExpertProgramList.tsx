'use client'

import { useState } from 'react'
import { updateProgramSource } from '@/app/actions/updateProgramSource'
import { Activity, Target, Coins, Settings, Pencil } from 'lucide-react'
import EditProgramModal from './EditProgramModal'

// Define a type for our aggregated data
// In a real app, this might share types with backend DTOs
export interface ExpertProgramData {
    id: string
    name: string
    status: 'active' | 'archived'
    conversion_source: 'platform' | 'ga4'
    metrics: {
        total_spend: number
        total_leads_platform: number
        total_leads_ga4: number
        cpl_platform: number
        cpl_ga4: number
    }
    total_budget?: number
    start_date?: string
    end_date?: string
}

export default function ExpertProgramList({ programs }: { programs: ExpertProgramData[] }) {
    // Optimistic UI could be added here, but for now we rely on logical state/revalidation
    const [updating, setUpdating] = useState<string | null>(null)
    const [editingProgram, setEditingProgram] = useState<ExpertProgramData | null>(null)

    const handleSourceSwitch = async (programId: string, newSource: 'platform' | 'ga4') => {
        setUpdating(programId)
        try {
            await updateProgramSource(programId, newSource)
        } catch (err) {
            console.error(err)
            alert("Erreur lors de la mise à jour")
        } finally {
            setUpdating(null)
        }
    }

    return (
        <div className="space-y-6">
            <EditProgramModal
                isOpen={!!editingProgram}
                onClose={() => setEditingProgram(null)}
                program={editingProgram}
            />

            {programs.map((program) => {
                const isActiveSourceGA4 = program.conversion_source === 'ga4'

                // Determine values to display based on current source
                const currentLeads = isActiveSourceGA4
                    ? program.metrics.total_leads_ga4
                    : program.metrics.total_leads_platform

                const currentCPL = isActiveSourceGA4
                    ? program.metrics.cpl_ga4
                    : program.metrics.cpl_platform

                return (
                    <div key={program.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 transition hover:shadow-md">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-slate-800">{program.name}</h3>
                                    <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded-full tracking-wide ${program.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {program.status}
                                    </span>
                                    <button
                                        onClick={() => setEditingProgram(program)}
                                        className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                                    >
                                        <Pencil className="h-3 w-3" />
                                        Modifier
                                    </button>
                                </div>
                                <p className="text-slate-500 text-sm mt-1 flex items-center gap-1">
                                    <Settings className="h-3 w-3" />
                                    Source de conversion active :
                                    <strong className={isActiveSourceGA4 ? 'text-orange-600' : 'text-blue-600'}>
                                        {isActiveSourceGA4 ? 'Google Analytics 4' : 'Plateformes Publicitaires'}
                                    </strong>
                                </p>
                            </div>

                            {/* Source Switcher */}
                            <div className="flex items-center bg-slate-100 p-1.5 rounded-lg">
                                <button
                                    onClick={() => handleSourceSwitch(program.id, 'platform')}
                                    disabled={updating === program.id}
                                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${!isActiveSourceGA4
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    Ads Platform
                                </button>
                                <button
                                    onClick={() => handleSourceSwitch(program.id, 'ga4')}
                                    disabled={updating === program.id}
                                    className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${isActiveSourceGA4
                                        ? 'bg-white text-orange-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    GA4
                                </button>
                            </div>
                        </div>

                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Coins className="h-4 w-4" />
                                        <span className="text-sm font-medium">Dépenses Totales</span>
                                    </div>
                                    {program.total_budget && (
                                        <span className="text-xs font-semibold text-slate-400">
                                            / {program.total_budget.toLocaleString()} €
                                        </span>
                                    )}
                                </div>
                                <p className="text-2xl font-bold text-slate-900">{program.metrics.total_spend.toLocaleString()} €</p>
                            </div>

                            <div className={`p-4 rounded-lg border transition-colors ${isActiveSourceGA4 ? 'bg-orange-50 border-orange-100' : 'bg-blue-50 border-blue-100'}`}>
                                <div className={`flex items-center gap-2 mb-2 ${isActiveSourceGA4 ? 'text-orange-600' : 'text-blue-600'}`}>
                                    <Target className="h-4 w-4" />
                                    <span className="text-sm font-medium">Leads ({isActiveSourceGA4 ? 'GA4' : 'Platform'})</span>
                                </div>
                                <p className={`text-2xl font-bold ${isActiveSourceGA4 ? 'text-orange-900' : 'text-blue-900'}`}>
                                    {currentLeads}
                                </p>
                            </div>

                            <div className="p-4 bg-white rounded-lg border border-slate-200">
                                <div className="flex items-center gap-2 text-slate-500 mb-2">
                                    <Activity className="h-4 w-4" />
                                    <span className="text-sm font-medium">CPL Moyen</span>
                                </div>
                                <p className="text-2xl font-bold text-slate-900">
                                    {currentCPL > 0 ? currentCPL.toFixed(1) + ' €' : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
