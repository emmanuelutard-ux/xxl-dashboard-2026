"use client";

import { useState } from 'react';
import { RealEstateProgram, UserRole } from '@/types';
import { useRole } from '@/contexts/RoleContext';
import { useProgramStats } from '@/hooks/useProgramStats';
import { ArrowUpRight, ArrowDownRight, Users, Euro, Target, Calendar } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface ProgramDashboardProps {
    programs: RealEstateProgram[];
}

export default function ProgramDashboard({ programs }: ProgramDashboardProps) {
    const { role } = useRole();
    const [selectedProgramId, setSelectedProgramId] = useState<string>(programs[0]?.id || '');

    const selectedProgram = programs.find(p => p.id === selectedProgramId) || programs[0];

    // Logic for Expert override
    const [expertSourceOverride, setExpertSourceOverride] = useState<'platform' | 'ga4' | undefined>(undefined);

    // Get effective stats
    const stats = useProgramStats(selectedProgram, role === 'expert' ? expertSourceOverride : undefined);

    // Determine current source for UI label
    const currentSource = (role === 'expert' && expertSourceOverride)
        ? expertSourceOverride
        : selectedProgram.conversion_source;

    return (
        <div className="space-y-8 pb-20">
            {/* Header & Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {role === 'client' ? 'Mon Tableau de Bord' : 'Pilotage Programmes'}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {role === 'client' && `Bienvenue sur le suivi de ${selectedProgram.name}`}
                        {role === 'agency' && 'Gestion des campagnes et créatifs'}
                        {role === 'expert' && 'Analyse avancée et optimisation'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Program Selector */}
                    <select
                        value={selectedProgram.id}
                        onChange={(e) => {
                            setSelectedProgramId(e.target.value);
                            setExpertSourceOverride(undefined); // Reset override on program change
                        }}
                        className="p-2 border border-slate-300 rounded-lg bg-white shadow-sm font-medium"
                    >
                        {programs.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    {/* Expert Source Switcher */}
                    {role === 'expert' && (
                        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setExpertSourceOverride('platform')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${(expertSourceOverride === 'platform' || (!expertSourceOverride && selectedProgram.conversion_source === 'platform'))
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Platform
                            </button>
                            <button
                                onClick={() => setExpertSourceOverride('ga4')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${(expertSourceOverride === 'ga4' || (!expertSourceOverride && selectedProgram.conversion_source === 'ga4'))
                                        ? 'bg-white text-orange-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                GA4
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Role-Specific Context Alert */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-0.5">
                    <Target className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="font-bold text-blue-900 text-sm uppercase mb-1">Source de Données Active</h3>
                    <p className="text-sm text-blue-700">
                        Les conversions affichées proviennent de <strong>{currentSource === 'ga4' ? 'Google Analytics 4' : 'Régies Publicitaires (Média)'}</strong>.
                        {role !== 'expert' && (
                            <span className="opacity-75"> (Configuré par défaut pour ce programme)</span>
                        )}
                    </p>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Dépenses Totales"
                    value={`${stats.spent_budget.toLocaleString()} €`}
                    icon={<Euro className="h-5 w-5" />}
                    trend={-2} // Fake trend
                />
                <KpiCard
                    title="Coût par Lead (CPL)"
                    value={`${stats.cpl} €`}
                    icon={<Target className="h-5 w-5" />}
                    highlight
                    trend={currentSource === 'ga4' ? 12 : -5}
                />
                <KpiCard
                    title="Leads / Conversions"
                    value={stats.leads}
                    icon={<Users className="h-5 w-5" />}
                />
                <KpiCard
                    title="Rendez-vous"
                    value={stats.appointments}
                    icon={<Calendar className="h-5 w-5" />}
                    role={role}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-slate-400" />
                        Évolution des Leads ({currentSource?.toUpperCase()})
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={selectedProgram.history}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: '#F1F5F9' }}
                                />
                                <Bar
                                    dataKey="leads"
                                    name="Leads"
                                    fill={currentSource === 'ga4' ? '#f97316' : '#3b82f6'}
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Side Panel (Role dependent) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    {role === 'client' && (
                        <div className="space-y-6">
                            <h3 className="font-bold text-slate-800">Vos Actions</h3>
                            <button className="w-full py-3 bg-xxl-blue text-white rounded-lg font-bold hover:bg-blue-700 transition">
                                Valider les derniers créatifs
                            </button>
                            <button className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-50 transition">
                                Contacter mon Expert
                            </button>
                        </div>
                    )}

                    {role === 'agency' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-800">Media Room</h3>
                            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-400 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition">
                                <p>Glisser-déposer des fichiers ici</p>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Validés</span>
                                    <span className="font-bold text-green-600">12</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>En attente</span>
                                    <span className="font-bold text-orange-500">3</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {role === 'expert' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-slate-800">Diagnostics</h3>
                            <div className="text-sm space-y-3">
                                <div className="flex items-center justify-between p-2 bg-red-50 text-red-700 rounded-lg">
                                    <span>Pacing Budget</span>
                                    <span className="font-bold">-12%</span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-green-50 text-green-700 rounded-lg">
                                    <span>Qualité Lead</span>
                                    <span className="font-bold">A+</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface KpiCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    highlight?: boolean;
    trend?: number;
    role?: UserRole;
}

function KpiCard({ title, value, icon, highlight, trend }: KpiCardProps) {
    // Hide specialized cards for simple roles if needed, though Client usually sees main KPIs.
    return (
        <div className={`p-5 rounded-2xl shadow-sm border transition-all duration-200 ${highlight ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg ${highlight ? 'bg-white text-blue-600 shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                    {icon}
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                        {trend > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    </div>
                )}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            </div>
        </div>
    );
}
