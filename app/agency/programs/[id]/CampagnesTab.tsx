import { ChannelLogo } from '@/components/ds/ChannelLogo'

type GoogleCampaign = {
  id: string
  nom: string | null
  type: string | null
  is_active: boolean | null
}

type MetaCampaign = {
  id: string
  nom: string | null
  objective: string | null
  is_active: boolean | null
}

interface CampagnesTabProps {
  googleCampaigns: GoogleCampaign[]
  metaCampaigns: MetaCampaign[]
}

const GOOGLE_TYPE_LABEL: Record<string, string> = {
  SEARCH:          'Search',
  PERFORMANCE_MAX: 'Performance Max',
  DISPLAY:         'Display',
  VIDEO:           'Vidéo',
  SHOPPING:        'Shopping',
}

const META_OBJ_LABEL: Record<string, string> = {
  OUTCOME_LEADS:     'Génération de leads',
  LEAD_GENERATION:   'Génération de leads',
  OUTCOME_AWARENESS: 'Notoriété',
  REACH:             'Portée',
  OUTCOME_TRAFFIC:   'Trafic',
}

function StatusDot({ active }: { active: boolean | null }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-sand-300'}`}
      />
      <span className={`text-[12px] ${active ? 'text-emerald-700' : 'text-sand-400'}`}>
        {active ? 'Active' : 'Inactive'}
      </span>
    </span>
  )
}

function EmptyChannelState({ channel }: { channel: 'google' | 'meta' }) {
  return (
    <tr>
      <td colSpan={3} className="px-5 py-6 text-center text-[12px] text-sand-400">
        Aucune campagne {channel === 'google' ? 'Google Ads' : 'Meta Ads'} synchronisée.
      </td>
    </tr>
  )
}

export default function CampagnesTab({ googleCampaigns, metaCampaigns }: CampagnesTabProps) {
  return (
    <div className="space-y-5">

      {/* Google Ads */}
      <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-sand-100 flex items-center gap-2">
          <ChannelLogo channel="google" size={14} />
          <p className="text-[13px] font-semibold text-sand-900">Google Ads</p>
          <span className="ml-auto text-[11px] text-sand-400 tabular-nums">
            {googleCampaigns.length} campagne{googleCampaigns.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-sand-100 bg-sand-50">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">
                  Nom de la campagne
                </th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">
                  Type
                </th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {googleCampaigns.length === 0
                ? <EmptyChannelState channel="google" />
                : googleCampaigns.map(c => (
                  <tr key={c.id} className="hover:bg-sand-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-sand-900">
                      {c.nom ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-sand-600">
                      {c.type ? (GOOGLE_TYPE_LABEL[c.type] ?? c.type) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusDot active={c.is_active} />
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Meta Ads */}
      <div className="rounded-[10px] border border-sand-200 bg-white shadow-ds-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-sand-100 flex items-center gap-2">
          <ChannelLogo channel="meta" size={14} />
          <p className="text-[13px] font-semibold text-sand-900">Meta Ads</p>
          <span className="ml-auto text-[11px] text-sand-400 tabular-nums">
            {metaCampaigns.length} campagne{metaCampaigns.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-sand-100 bg-sand-50">
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">
                  Nom de la campagne
                </th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">
                  Objectif
                </th>
                <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-sand-500 tracking-[0.04em]">
                  Statut
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {metaCampaigns.length === 0
                ? <EmptyChannelState channel="meta" />
                : metaCampaigns.map(c => (
                  <tr key={c.id} className="hover:bg-sand-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-sand-900">
                      {c.nom ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-sand-600">
                      {c.objective ? (META_OBJ_LABEL[c.objective] ?? c.objective) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <StatusDot active={c.is_active} />
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Note synchro */}
      <p className="text-[11px] text-sand-400 text-center">
        Les campagnes sont synchronisées depuis les régies publicitaires. La synchronisation manuelle est désactivée.
      </p>
    </div>
  )
}
