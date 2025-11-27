
"use client";

import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

interface DashboardFiltersProps {
    campaigns: string[];
}

export default function DashboardFilters({ campaigns }: DashboardFiltersProps) {
    const searchParams = useSearchParams();

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <form className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex flex-col gap-1 w-full md:w-auto">
                    <label className="text-xs font-medium text-slate-500">Campagne</label>
                    <select
                        name="campaign"
                        defaultValue={searchParams.get("campaign") || ""}
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 w-full md:w-64"
                    >
                        <option value="">Toutes les campagnes</option>
                        {campaigns.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1 w-full md:w-auto">
                    <label className="text-xs font-medium text-slate-500">Du</label>
                    <input
                        type="date"
                        name="from"
                        defaultValue={searchParams.get("from") || ""}
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col gap-1 w-full md:w-auto">
                    <label className="text-xs font-medium text-slate-500">Au</label>
                    <input
                        type="date"
                        name="to"
                        defaultValue={searchParams.get("to") || ""}
                        className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    />
                </div>

                <button
                    type="submit"
                    className="h-10 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Search className="h-4 w-4" />
                    Filtrer
                </button>
            </form>
        </div>
    );
}

