
import { getDebugMetrics, getDebugCampaignList } from '@/app/actions/getDebugMetrics';
import DashboardChart from '@/components/DashboardChart';

// FORCE LE MODE DYNAMIQUE (Crucial pour les filtres)
export const dynamic = 'force-dynamic';

export default async function DashboardPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const campaignsList = await getDebugCampaignList();
  const { metrics, rawData, campaignsBreakdown } = await getDebugMetrics(searchParams);

  const m = metrics || { totalSpent: 0, totalImpressions: 0, totalClicks: 0, totalLeads: 0 };

  // Ratios Globaux
  const ctr = m.totalImpressions > 0 ? (m.totalClicks / m.totalImpressions) * 100 : 0;
  const cpc = m.totalClicks > 0 ? m.totalSpent / m.totalClicks : 0;
  const cpl = m.totalLeads > 0 ? m.totalSpent / m.totalLeads : 0;
  const conversionRate = m.totalClicks > 0 ? (m.totalLeads / m.totalClicks) * 100 : 0;

  // Historique Graphique (Déjà trié par le backend)
  const historyMap = new Map();
  rawData.forEach((row: any) => {
    const d = new Date(row.date);
    const key = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!historyMap.has(key)) historyMap.set(key, { date: key, leads: 0, appointments: 0 });
    const entry = historyMap.get(key);
    entry.leads += Number(row.leads) || 0;
  });
  const history = Array.from(historyMap.values()); // L'ordre est préservé car rawData est trié

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cockpit Promoteur</h1>
      </div>

      {/* FILTRES */}
      <form className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">

        {/* Nouveau : Select Plateforme */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Plateforme</label>
          <select name="platform" defaultValue={searchParams.platform || ''} className="border border-slate-300 p-2 rounded-md text-sm w-40 bg-white">
            <option value="">Toutes</option>
            <option value="Google">Google Ads</option>
            <option value="Meta">Meta Ads</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Campagne</label>
          <select name="campaign" defaultValue={searchParams.campaign || ''} className="border border-slate-300 p-2 rounded-md text-sm w-64 bg-white">
            <option value="">Toutes les campagnes</option>
            {campaignsList.map((c: string) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Du</label>
          <input type="date" name="from" defaultValue={searchParams.from || ''} className="border border-slate-300 p-2 rounded-md text-sm" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-slate-500 uppercase">Au</label>
          <input type="date" name="to" defaultValue={searchParams.to || ''} className="border border-slate-300 p-2 rounded-md text-sm" />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-bold hover:opacity-90 h-[38px]">Filtrer</button>
      </form>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Dépenses" value={`${m.totalSpent.toFixed(2)} €`} icon="€" />
        <KpiCard title="Impressions" value={m.totalImpressions.toLocaleString()} icon="👁️" />
        <KpiCard title="Clics" value={m.totalClicks.toLocaleString()} icon="👆" />
        <KpiCard title="CTR" value={`${ctr.toFixed(2)}%`} icon="%" />
        <KpiCard title="CPC Moyen" value={`${cpc.toFixed(2)} €`} icon="€" />
        <KpiCard title="Conversions" value={m.totalLeads.toLocaleString()} icon="🎯" highlight />
        <KpiCard title="CPL" value={`${cpl.toFixed(2)} €`} icon="📉" />
        <KpiCard title="Taux Conv." value={`${conversionRate.toFixed(2)}%`} icon="%" />
      </div>

      {/* --- SECTION BENCHMARK --- */}
      <div className="bg-slate-100 p-6 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Moyennes Marché (Immobilier France 2024)</h2>
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Source: WordStream & LocaliQ</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Carte 1 : CTR */}
          <BenchmarkCard
            label="CTR Moyen"
            marketValue={4.50}
            myValue={ctr}
            unit="%"
            inverse={false} // Plus c'est haut mieux c'est
          />
          {/* Carte 2 : CPC */}
          <BenchmarkCard
            label="CPC Moyen"
            marketValue={1.45}
            myValue={cpc}
            unit="€"
            inverse={true} // Plus c'est bas mieux c'est
          />
          {/* Carte 3 : CPL */}
          <BenchmarkCard
            label="CPL Moyen"
            marketValue={55.00}
            myValue={cpl}
            unit="€"
            inverse={true}
          />
          {/* Carte 4 : Conversion */}
          <BenchmarkCard
            label="Taux Conv."
            marketValue={3.00}
            myValue={conversionRate}
            unit="%"
            inverse={false}
          />
        </div>
      </div>

      {/* GRAPHIQUE */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-bold mb-4 text-slate-800">Évolution Temporelle</h2>
        <div className="h-[300px]">
          <DashboardChart data={history} />
        </div>
      </div>

      {/* TABLEAU PERFORMANCE CAMPAGNES */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Détail par Campagne</h2>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="p-4">Campagne</th>
              <th className="p-4">Source</th>
              <th className="p-4 text-right">Dépenses</th>
              <th className="p-4 text-right">Leads</th>
              <th className="p-4 text-right">CPL</th>
            </tr>
          </thead>
          <tbody>
            {campaignsBreakdown.map((c: any) => (
              <tr key={c.name} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-900">{c.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${c.source?.toLowerCase().includes('google') ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {c.source}
                  </span>
                </td>
                <td className="p-4 text-right">{c.spent.toFixed(2)} €</td>
                <td className="p-4 text-right font-bold">{c.leads}</td>
                <td className="p-4 text-right">{(c.leads > 0 ? c.spent / c.leads : 0).toFixed(2)} €</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Petit composant local pour les cartes
function KpiCard({ title, value, icon, highlight }: any) {
  return (
    <div className={`p-4 rounded-xl shadow-sm border ${highlight ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="text-sm font-medium text-slate-500">
          {title}
        </div>
        <div className="text-slate-400">
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function BenchmarkCard({ label, marketValue, myValue, unit, inverse }: any) {
  // Logique couleur : Si inverse=true, on veut être en dessous du marché (ex: CPC).
  const isGood = inverse ? myValue < marketValue : myValue > marketValue;

  // Évite les NaN
  const safeMyValue = isNaN(myValue) ? 0 : myValue;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex justify-between items-center">
      <div>
        <div className="text-xs text-slate-400 mb-1">{label}</div>
        <div className="font-bold text-slate-700 text-lg">
          {marketValue} <span className="text-sm font-normal">{unit}</span>
        </div>
      </div>

      {/* Comparaison Visuelle */}
      <div className={`text-right px-3 py-1 rounded-md text-xs font-bold ${isGood ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
        {isGood ? 'Performance Top' : 'Optimisation possible'}
        <div className="font-normal opacity-80 mt-0.5">
          Vs Vous : {safeMyValue.toFixed(2)} {unit}
        </div>
      </div>
    </div>
  );
}

