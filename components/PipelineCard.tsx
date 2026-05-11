import Link from 'next/link'

export type PipelineCardProps = {
  id: string
  name: string
  promoteur: string | null
  cpl: number | null
  cplTone: 'good' | 'bad' | null
  alertPacing: string | null   // e.g. "Sous-conso 48 pts" — fond amber
  alertAsset: boolean          // "Manque visuel HD" — fond rose (mocked)
  since: string | null         // "il y a 3j" — affiché si pas d'alerte
}

export function PipelineCard({
  id,
  name,
  promoteur,
  cpl,
  cplTone,
  alertPacing,
  alertAsset,
  since,
}: PipelineCardProps) {
  const hasAlert = alertPacing !== null || alertAsset

  return (
    <Link
      href={`/agency/programs/${id}`}
      className="group block bg-white border border-sand-200 rounded-[10px] p-3 transition-all duration-150 hover:border-indigo-200 hover:shadow-ds-md cursor-pointer"
    >
      {/* Nom + promoteur */}
      <div className="text-[13px] font-semibold text-sand-900 leading-tight">{name}</div>
      {promoteur && (
        <div className="mt-0.5 text-[11px] text-sand-500">{promoteur}</div>
      )}

      {/* CPL (programmes live) */}
      {cpl !== null && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-sand-100 text-[11px]">
          <span className="text-sand-500">CPL</span>
          <span className={[
            'font-semibold tabular-nums',
            cplTone === 'good' ? 'text-emerald-700' : 'text-rose-700',
          ].join(' ')}>
            {cpl.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </span>
        </div>
      )}

      {/* Alerte pacing — fond amber */}
      {alertPacing && (
        <div className="mt-2 px-2 py-1 bg-amber-50 border border-amber-100 text-amber-700 text-[11px] rounded-md font-medium leading-tight">
          {alertPacing}
        </div>
      )}

      {/* Alerte asset — fond rose (mocké : active sans visuel_hd dans brief_data) */}
      {alertAsset && (
        <div className="mt-2 px-2 py-1 bg-rose-50 border border-rose-100 text-rose-700 text-[11px] rounded-md font-medium leading-tight">
          Manque visuel HD
        </div>
      )}

      {/* Horodatage — affiché uniquement si pas d'alerte */}
      {!hasAlert && since && (
        <div className="mt-2 text-[11px] text-sand-400">{since}</div>
      )}
    </Link>
  )
}

export default PipelineCard
