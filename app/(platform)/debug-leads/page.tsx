import { getDebugMetrics, getDebugCampaignList } from '@/app/actions/getDebugMetrics';

// Force le rechargement à chaque fois
export const dynamic = 'force-dynamic';

export default async function DebugPage(props: {
    searchParams: Promise<{ [key: string]: string | undefined }>
}) {
    // 1. On attend que les paramètres soient disponibles (AWAIT CRUCIAL)
    const searchParams = await props.searchParams;

    // 2. On récupère les données
    const campaigns = await getDebugCampaignList();
    const { metrics, logs, rawData } = await getDebugMetrics(searchParams);

    return (
        <div className="p-8 bg-slate-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                🐞 Debug Leads & Filtres
            </h1>

            {/* FORMULAIRE HTML NATIF */}
            <form className="flex gap-4 items-end bg-white p-4 rounded shadow mb-8">
                <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold">Campagne</label>
                    <select
                        name="campaign"
                        defaultValue={searchParams.campaign || ''}
                        className="border p-2 rounded w-64 bg-white"
                    >
                        <option value="">Toutes les campagnes</option>
                        {campaigns.map((c: any) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold">Du</label>
                    <input
                        type="date"
                        name="from"
                        defaultValue={searchParams.from || ''}
                        className="border p-2 rounded"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-bold">Au</label>
                    <input
                        type="date"
                        name="to"
                        defaultValue={searchParams.to || ''}
                        className="border p-2 rounded"
                    />
                </div>

                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700 h-10">
                    Lancer le Test
                </button>
            </form>

            {/* RESULTATS */}
            <div className="bg-blue-600 text-white p-8 rounded-xl text-center mb-8 shadow-lg">
                <h2 className="text-xl opacity-80 mb-2">Total Leads Trouvés</h2>
                <div className="text-8xl font-bold">{metrics?.totalLeads || 0}</div>
                <p className="mt-4 opacity-80">Sur {metrics?.count || 0} lignes analysées</p>
            </div>

            {/* LOGS */}
            <div className="bg-slate-900 text-green-400 p-6 rounded-xl font-mono text-sm overflow-auto mb-8">
                <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2">Logs du Serveur</h3>
                {logs.map((log, i) => (
                    <div key={i} className="mb-1">{`> ${log}`}</div>
                ))}
            </div>

            {/* RAW DATA */}
            <div className="bg-white p-6 rounded-xl shadow border border-slate-200 overflow-auto">
                <h3 className="font-bold mb-4 text-slate-700">Données Brutes (Extrait 5 lignes)</h3>
                <pre className="text-xs text-slate-500">
                    {JSON.stringify(rawData.slice(0, 5), null, 2)}
                </pre>
            </div>
        </div>
    );
}
