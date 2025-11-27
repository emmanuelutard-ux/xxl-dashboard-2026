"use client";

import { useState, useEffect } from "react";
import {
    Calculator,
    Check,
    FileText,
    Globe,
    Facebook,
    Video,
    MousePointerClick,
    Users,
    Euro
} from "lucide-react";
import { cn } from "@/lib/utils";

type Secteur = 'immobilier' | 'restaurant';
type Objectif = 'vente' | 'lead' | 'trafic_physique' | 'notoriete';
type Asset = 'Images' | 'Video' | 'Site Web';

interface StrategyResult {
    channels: {
        name: string;
        icon: any;
        color: string;
        budgetShare: number;
    }[];
    financials: {
        monthlyMedia: number;
        totalMedia: number;
        managementFees: number;
        setupFees: number;
        totalFees: number;
        grandTotal: number;
    };
    projections: {
        views: number;
        leads: number;
        cpl: number;
    };
}

export default function StrategyPage() {
    // State
    const [secteur, setSecteur] = useState<Secteur>('immobilier');
    const [ville, setVille] = useState<string>('Paris');
    const [budgetQuotidien, setBudgetQuotidien] = useState<number>(50);
    const [objectif, setObjectif] = useState<Objectif>('lead');
    const [assets, setAssets] = useState<Asset[]>(['Images', 'Site Web']);

    const [result, setResult] = useState<StrategyResult | null>(null);

    // Logic
    useEffect(() => {
        const calculateStrategy = () => {
            // 1. Channels Logic
            let channels = [];

            if (secteur === 'immobilier') {
                channels.push({ name: 'Google Ads', icon: Globe, color: 'text-blue-600', budgetShare: 0.6 });
                channels.push({ name: 'Meta Ads', icon: Facebook, color: 'text-blue-700', budgetShare: 0.4 });
            } else { // restaurant
                channels.push({ name: 'Meta Ads', icon: Facebook, color: 'text-blue-700', budgetShare: 0.7 });
                if (assets.includes('Video')) {
                    channels.push({ name: 'TikTok Ads', icon: Video, color: 'text-black', budgetShare: 0.3 });
                } else {
                    // Redistribute if no video for TikTok
                    channels[0].budgetShare = 1.0;
                }
            }

            // Objectif Overrides
            const hasGoogle = channels.find(c => c.name === 'Google Ads');
            const hasMeta = channels.find(c => c.name === 'Meta Ads');

            if (objectif === 'lead' && !hasGoogle) {
                // Force Google for leads if not present (e.g. restaurant wanting leads)
                channels.unshift({ name: 'Google Ads', icon: Globe, color: 'text-blue-600', budgetShare: 0.5 });
                channels.forEach(c => { if (c.name !== 'Google Ads') c.budgetShare = 0.5 / (channels.length - 1) });
            }

            if (objectif === 'notoriete') {
                if (!hasMeta) {
                    channels.push({ name: 'Meta Ads', icon: Facebook, color: 'text-blue-700', budgetShare: 0.5 });
                }
                // If we have video, ensure TikTok is there for awareness
                if (assets.includes('Video') && !channels.find(c => c.name === 'TikTok Ads')) {
                    channels.push({ name: 'TikTok Ads', icon: Video, color: 'text-black', budgetShare: 0.2 });
                }
                // Rebalance
                const share = 1 / channels.length;
                channels.forEach(c => c.budgetShare = share);
            }

            // 2. Financials
            const monthlyMedia = budgetQuotidien * 30;
            const totalMedia = monthlyMedia * 3; // 3 months
            const managementFees = totalMedia * 0.15;
            const setupFees = channels.length * 500;
            const totalFees = managementFees + setupFees;
            const grandTotal = totalMedia + totalFees;

            // 3. Projections (Simple Assumptions)
            // CPM avg 15€, CPL avg 40€ (Immo) or 15€ (Resto)
            const cpm = 15;
            let estimatedCpl = secteur === 'immobilier' ? 50 : 15;
            if (objectif === 'notoriete') estimatedCpl *= 3; // Leads are more expensive in awareness campaigns

            const views = Math.floor((totalMedia / cpm) * 1000);
            const leads = Math.floor(totalMedia / estimatedCpl);

            setResult({
                channels,
                financials: {
                    monthlyMedia,
                    totalMedia,
                    managementFees,
                    setupFees,
                    totalFees,
                    grandTotal
                },
                projections: {
                    views,
                    leads,
                    cpl: estimatedCpl
                }
            });
        };

        calculateStrategy();
    }, [secteur, ville, budgetQuotidien, objectif, assets]);

    const toggleAsset = (asset: Asset) => {
        setAssets(prev =>
            prev.includes(asset)
                ? prev.filter(a => a !== asset)
                : [...prev, asset]
        );
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

    const formatNumber = (val: number) =>
        new Intl.NumberFormat('fr-FR').format(val);

    if (!result) return <div>Chargement...</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Générateur de Stratégie</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Configuration */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit space-y-6">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Calculator className="h-5 w-5 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">Contexte Client</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Secteur d'activité</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                value={secteur}
                                onChange={(e) => setSecteur(e.target.value as Secteur)}
                            >
                                <option value="immobilier">Immobilier</option>
                                <option value="restaurant">Restauration</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Ville Cible</label>
                            <input
                                type="text"
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                value={ville}
                                onChange={(e) => setVille(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Budget Quotidien (€)</label>
                            <input
                                type="number"
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                value={budgetQuotidien}
                                onChange={(e) => setBudgetQuotidien(Number(e.target.value))}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Objectif Principal</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                value={objectif}
                                onChange={(e) => setObjectif(e.target.value as Objectif)}
                            >
                                <option value="lead">Génération de Leads</option>
                                <option value="vente">Vente Directe</option>
                                <option value="trafic_physique">Trafic Point de Vente</option>
                                <option value="notoriete">Notoriété / Visibilité</option>
                            </select>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <label className="text-sm font-medium text-slate-700">Assets Disponibles</label>
                            <div className="space-y-2">
                                {(['Images', 'Video', 'Site Web'] as Asset[]).map((asset) => (
                                    <div key={asset} className="flex items-center space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleAsset(asset)}
                                            className={cn(
                                                "flex h-5 w-5 items-center justify-center rounded border transition-colors",
                                                assets.includes(asset) ? "bg-xxl-blue border-xxl-blue text-white" : "border-slate-300 bg-white"
                                            )}
                                        >
                                            {assets.includes(asset) && <Check className="h-3.5 w-3.5" />}
                                        </button>
                                        <span className="text-sm text-slate-600">{asset}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Proposal */}
                <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-slate-200 space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Recommandation Stratégique</h2>
                            <p className="text-slate-500">Pour votre campagne à <span className="font-semibold text-slate-900">{ville}</span></p>
                        </div>
                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            <Check className="h-4 w-4" />
                            Stratégie Optimisée
                        </div>
                    </div>

                    {/* Section 1: Media Mix */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800">1. Mix Média Recommandé</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {result.channels.map((channel) => (
                                <div key={channel.name} className="flex items-center p-4 rounded-lg border border-slate-100 bg-slate-50">
                                    <div className={cn("p-2 rounded-full bg-white shadow-sm mr-3", channel.color)}>
                                        <channel.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-900">{channel.name}</div>
                                        <div className="text-sm text-slate-500">Budget: {Math.round(channel.budgetShare * 100)}%</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 2: Projections */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800">2. Projections (3 mois)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                                <div className="flex items-center gap-2 text-blue-700 mb-2">
                                    <Euro className="h-4 w-4" />
                                    <span className="text-sm font-medium">Budget Média Total</span>
                                </div>
                                <div className="text-2xl font-bold text-blue-900">{formatCurrency(result.financials.totalMedia)}</div>
                            </div>
                            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2 text-slate-600 mb-2">
                                    <MousePointerClick className="h-4 w-4" />
                                    <span className="text-sm font-medium">Est. Vues</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-900">{formatNumber(result.projections.views)}</div>
                            </div>
                            <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-2 text-slate-600 mb-2">
                                    <Users className="h-4 w-4" />
                                    <span className="text-sm font-medium">Est. Leads</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-900">{formatNumber(result.projections.leads)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Agency Quote */}
                    <div className="bg-slate-900 text-white p-6 rounded-xl space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                            <h3 className="text-lg font-semibold">Investissement & Honoraires</h3>
                            <span className="text-sm text-slate-400">Durée: 3 mois</span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300">Budget Média (Net)</span>
                                <span className="font-medium">{formatCurrency(result.financials.totalMedia)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300">Frais de Gestion (15%)</span>
                                <span className="font-medium">{formatCurrency(result.financials.managementFees)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-300">Frais de Setup ({result.channels.length} canaux)</span>
                                <span className="font-medium">{formatCurrency(result.financials.setupFees)}</span>
                            </div>
                            <div className="border-t border-slate-700 pt-3 flex justify-between items-center text-lg font-bold text-blue-400">
                                <span>Total Projet</span>
                                <span>{formatCurrency(result.financials.grandTotal)}</span>
                            </div>
                        </div>

                        <button className="w-full bg-xxl-blue hover:bg-xxl-blue/90 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                            <FileText className="h-5 w-5" />
                            Exporter la proposition PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
