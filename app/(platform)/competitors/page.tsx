"use client";

import { useState } from "react";
import { Search, History, ExternalLink } from "lucide-react";

const MOCK_HISTORY = [
    "Kaufman & Broad",
    "Vinci Immobilier",
    "Nexity",
];

export default function CompetitorsPage() {
    const [searchTerm, setSearchTerm] = useState("");

    const handleGoogleSearch = () => {
        if (!searchTerm) return;
        window.open(`https://adstransparency.google.com/?region=FR&term=${encodeURIComponent(searchTerm)}`, '_blank');
    };

    const handleMetaSearch = () => {
        if (!searchTerm) return;
        window.open(`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=FR&q=${encodeURIComponent(searchTerm)}`, '_blank');
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Benchmark Concurrents</h1>

            {/* Search Section */}
            <div className="max-w-4xl mx-auto bg-white p-10 rounded-xl shadow-sm border border-slate-200">
                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-semibold text-slate-800">Rechercher un concurrent</h2>
                    <p className="text-slate-500 mt-2">Analysez les stratégies publicitaires de vos concurrents</p>
                </div>

                <div className="space-y-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Entrez le nom d'un promoteur ou concurrent (ex: Nexity)"
                            className="flex h-12 w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-10 text-lg ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleGoogleSearch();
                            }}
                        />
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row">
                        <button
                            onClick={handleGoogleSearch}
                            disabled={!searchTerm}
                            className="inline-flex flex-1 items-center justify-center rounded-md bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed h-12 transition-colors"
                        >
                            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Voir les pubs Google Ads
                        </button>

                        <button
                            onClick={handleMetaSearch}
                            disabled={!searchTerm}
                            className="inline-flex flex-1 items-center justify-center rounded-md bg-[#1877F2] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#166fe5] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed h-12 transition-colors"
                        >
                            <svg className="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.79-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Voir les pubs Meta/Facebook
                        </button>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="max-w-4xl mx-auto">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-800 mb-4">
                        <History className="h-5 w-5 text-slate-500" />
                        Historique des recherches
                    </h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        {MOCK_HISTORY.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-700 shadow-sm transition-colors hover:bg-white hover:border-blue-200 hover:text-blue-600 cursor-pointer"
                                onClick={() => setSearchTerm(item)}
                            >
                                <span className="font-medium">{item}</span>
                                <ExternalLink className="h-4 w-4 text-slate-400" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
