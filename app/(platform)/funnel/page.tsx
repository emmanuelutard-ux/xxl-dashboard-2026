import { getFunnelData, getFunnelCampaignList } from '@/app/actions/getFunnelData';
import { ArrowDown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function FunnelPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
    const searchParams = await props.searchParams;
    const campaignsList = await getFunnelCampaignList();
    const funnelData = await getFunnelData(searchParams);

    if (!funnelData) return <div>Erreur de chargement</div>;

    const { stage1_awareness, stage2_traffic, stage3_acquisition, stage4_business } = funnelData;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Entonnoir de Conversion</h1>
            </div>

            {/* FILTRES */}
            <form className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-wrap gap-4 items-end">
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

            {/* VISUAL FUNNEL */}
            <div className="flex flex-col items-center space-y-2">

                {/* STAGE 1: VISIBILITÉ */}
                <div className="w-full bg-blue-900 text-white p-6 rounded-xl shadow-lg relative">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold opacity-90">1. VISIBILITÉ</h3>
                            <div className="text-3xl font-bold mt-2">{stage1_awareness.impressions.toLocaleString()} <span className="text-sm font-normal opacity-70">Impressions</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold">{stage1_awareness.cost.toFixed(2)} € <span className="text-sm font-normal opacity-70">Dépensés</span></div>
                            <div className="text-sm opacity-70 mt-1">CPM: {stage1_awareness.cpm.toFixed(2)} €</div>
                        </div>
                    </div>
                </div>

                <ArrowDown className="text-slate-300 h-8 w-8" />

                {/* STAGE 2: TRAFIC SITE */}
                <div className="w-11/12 bg-blue-700 text-white p-6 rounded-xl shadow-lg relative">
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-blue-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-blue-100">
                        CTR: {stage2_traffic.ctr.toFixed(2)}%
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold opacity-90">2. TRAFIC SITE</h3>
                            <div className="text-3xl font-bold mt-2">{stage2_traffic.clicks.toLocaleString()} <span className="text-sm font-normal opacity-70">Clics</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-xl font-bold">{stage2_traffic.sessions.toLocaleString()} <span className="text-sm font-normal opacity-70">Sessions (Est.)</span></div>
                            <div className="text-sm opacity-70 mt-1">Taux de Rebond: {stage2_traffic.bounceRate}%</div>
                        </div>
                    </div>
                </div>

                <ArrowDown className="text-slate-300 h-8 w-8" />

                {/* STAGE 3: LEAD GEN */}
                <div className="w-10/12 bg-blue-500 text-white p-6 rounded-xl shadow-lg relative border-2 border-white ring-4 ring-blue-500/20">
                    <div className="absolute -top-3 right-6 bg-yellow-400 text-blue-900 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide">
                        Source de Vérité
                    </div>
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-blue-500 px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-blue-100">
                        Conv: {stage3_acquisition.conversionRate.toFixed(2)}%
                    </div>
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold opacity-90">3. LEAD GEN</h3>
                            <div className="text-4xl font-bold mt-2">{stage3_acquisition.leads.toLocaleString()} <span className="text-lg font-normal opacity-80">Leads</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{stage3_acquisition.cpl.toFixed(2)} € <span className="text-sm font-normal opacity-70">CPL</span></div>
                        </div>
                    </div>
                </div>

                <ArrowDown className="text-slate-300 h-8 w-8" />

                {/* STAGE 4: VENTES CRM */}
                <div className="w-9/12 bg-emerald-600 text-white p-6 rounded-xl shadow-lg relative">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold opacity-90">4. VENTES CRM (Estimé)</h3>
                            <div className="flex gap-8 mt-2">
                                <div>
                                    <div className="text-2xl font-bold">{stage4_business.appointments}</div>
                                    <div className="text-xs opacity-70 uppercase">RDV Qualifiés</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold">{stage4_business.sales}</div>
                                    <div className="text-xs opacity-70 uppercase">Ventes</div>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{stage4_business.cac.toFixed(2)} €</div>
                            <div className="text-sm opacity-70 mt-1">Coût Acquisition Client</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
