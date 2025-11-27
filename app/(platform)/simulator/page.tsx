"use client";

import { useState, useEffect } from "react";
import { Euro, Users, MousePointerClick, FileText } from "lucide-react";

type City = 'Bordeaux' | 'Paris' | 'Lyon' | 'Nantes';
type PropertyType = 'T2' | 'T3' | 'T4' | 'Maison';

const CPL_BASE: Record<City, number> = {
    'Paris': 120,
    'Bordeaux': 60,
    'Lyon': 80,
    'Nantes': 80,
};

const CPM = 15; // Cost Per Mille impressions assumption

export default function SimulatorPage() {
    const [city, setCity] = useState<City>('Bordeaux');
    const [budget, setBudget] = useState<number>(5000);
    const [propertyType, setPropertyType] = useState<PropertyType>('T3');

    const [leads, setLeads] = useState<number>(0);
    const [impressions, setImpressions] = useState<number>(0);
    const [cpl, setCpl] = useState<number>(0);

    useEffect(() => {
        let currentCpl = CPL_BASE[city];

        if (propertyType === 'Maison') {
            currentCpl *= 1.2; // +20% for houses
        }

        const calculatedLeads = Math.floor(budget / currentCpl);
        const calculatedImpressions = Math.floor((budget / CPM) * 1000);

        setCpl(currentCpl);
        setLeads(calculatedLeads);
        setImpressions(calculatedImpressions);
    }, [city, budget, propertyType]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

    const formatNumber = (value: number) =>
        new Intl.NumberFormat('fr-FR').format(value);

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Simulateur de Potentiel</h1>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Configuration Column */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 h-fit">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-slate-800">Configuration de la campagne</h2>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-slate-700">
                                Ville Cible
                            </label>
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                value={city}
                                onChange={(e) => setCity(e.target.value as City)}
                            >
                                <option value="Bordeaux">Bordeaux</option>
                                <option value="Paris">Paris</option>
                                <option value="Lyon">Lyon</option>
                                <option value="Nantes">Nantes</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-slate-700">
                                Budget Média Mensuel (€)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                    value={budget}
                                    onChange={(e) => setBudget(Number(e.target.value))}
                                    min={0}
                                />
                                <Euro className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none text-slate-700">
                                Type de bien
                            </label>
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                                value={propertyType}
                                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                            >
                                <option value="T2">T2</option>
                                <option value="T3">T3</option>
                                <option value="T4">T4</option>
                                <option value="Maison">Maison</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Predictions Column */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 h-fit space-y-8">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="text-sm font-medium text-slate-500">Estimation Leads</h3>
                                <Users className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="mt-2">
                                <div className="text-3xl font-bold text-blue-600">{leads}</div>
                                <p className="text-xs text-slate-500">
                                    contacts qualifiés / mois
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="text-sm font-medium text-slate-500">Estimation Vues</h3>
                                <MousePointerClick className="h-4 w-4 text-slate-400" />
                            </div>
                            <div className="mt-2">
                                <div className="text-3xl font-bold text-slate-900">{formatNumber(impressions)}</div>
                                <p className="text-xs text-slate-500">
                                    impressions estimées
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <h3 className="text-sm font-medium text-slate-800 mb-4">Détails du calcul</h3>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">Coût par Lead estimé (CPL)</span>
                            <span className="text-xl font-bold text-slate-900">{formatCurrency(cpl)}</span>
                        </div>
                        <p className="mt-2 text-xs text-slate-400">
                            Basé sur les données historiques pour {city} ({propertyType}).
                        </p>
                    </div>

                    <button className="inline-flex h-10 w-full items-center justify-center rounded-md bg-xxl-blue px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-xxl-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                        <FileText className="mr-2 h-4 w-4" />
                        Générer une proposition PDF
                    </button>
                </div>
            </div>
        </div>
    );
}
