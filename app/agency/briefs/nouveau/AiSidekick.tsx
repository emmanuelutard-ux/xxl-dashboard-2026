import { Sparkles, Lightbulb } from 'lucide-react'

interface SidekickProps {
  step: number
  hasBrs: boolean
  targetProfiles: string[]
  budgetGoogle: string
  budgetMeta: string
  googleActive: boolean
  metaActive: boolean
}

const HINTS: Record<number, { title: string; body: string; tip: string }> = {
  1: {
    title: 'Conseil nommage',
    body: 'Un nom court (2–3 mots + ville) sera plus lisible dans les tableaux de bord. Ex : "Galliéni Nanterre" plutôt que "Résidence Les Jardins de la Gare à Nanterre".',
    tip:  'Les programmes BRS gagnent à l\'avoir explicitement dans le nom pour la segmentation des rapports.',
  },
  2: {
    title: 'Ciblage & USP',
    body: 'Pour un programme BRS, privilégiez "Primo-accédants". Les arguments BRS (accessibilité, prix réduit) convertissent 2× mieux en Lead Gen Volume sur Meta.',
    tip:  'Benchmark : CPL Meta BRS = 10–13 € vs 18–25 € pour l\'accession classique (ref. Gentilly Nov–Fév).',
  },
  3: {
    title: 'Répartition recommandée',
    body: 'En phase d\'amorçage, Meta 60% / Google 40% maximise le volume de contacts. Rééquilibrez après 3 semaines selon les CPL observés.',
    tip:  'Rayon géo Meta : 17 km imposé par la politique immobilier de Meta (non négociable).',
  },
  4: {
    title: 'Avant de valider',
    body: 'Vérifiez les dates et budgets. Une fois créé, connectez Google Ads et Meta dans l\'onglet "Campagnes" du programme.',
    tip:  'Le plan IA sera enregistré dans le brief et consultable depuis l\'onglet "Plan".',
  },
}

export default function AiSidekick({
  step,
  hasBrs,
  targetProfiles,
  budgetGoogle,
  budgetMeta,
  googleActive,
  metaActive,
}: SidekickProps) {
  const hint = HINTS[step]
  const bGoogle = Number(budgetGoogle) || 0
  const bMeta   = Number(budgetMeta)   || 0
  const bTotal  = bGoogle + bMeta

  const showBrsBadge   = step === 2 && hasBrs && !targetProfiles.includes('primo')
  const showBudgetBlock = step === 3 && bTotal > 0

  return (
    <div className="rounded-[10px] border border-indigo-100 bg-indigo-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
        <span className="text-[12px] font-semibold text-indigo-700">Assistant IA</span>
      </div>

      {hint && (
        <>
          <div>
            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-[0.06em] mb-1">{hint.title}</p>
            <p className="text-[12px] text-indigo-800 leading-relaxed">{hint.body}</p>
          </div>

          <div className="rounded-ds-sm bg-white border border-indigo-100 px-3 py-2">
            <div className="flex items-start gap-1.5">
              <Lightbulb className="h-3 w-3 text-terra-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-sand-600 leading-relaxed">{hint.tip}</p>
            </div>
          </div>
        </>
      )}

      {/* Alerte BRS sur step 2 */}
      {showBrsBadge && (
        <div className="rounded-ds-sm bg-amber-50 border border-amber-200 px-3 py-2">
          <p className="text-[11px] text-amber-700 leading-relaxed">
            BRS détecté — pensez à sélectionner <span className="font-semibold">Primo-accédants</span> comme profil cible principal.
          </p>
        </div>
      )}

      {/* Résumé budget step 3 */}
      {showBudgetBlock && (
        <div className="rounded-ds-sm bg-white border border-indigo-100 px-3 py-2.5 space-y-1.5">
          <p className="text-[10px] font-semibold text-sand-400 uppercase tracking-[0.06em]">Budget total</p>
          <p className="text-[18px] font-semibold text-sand-900 tabular-nums leading-none">
            {bTotal.toLocaleString('fr-FR')} €
          </p>
          {googleActive && metaActive && bTotal > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-sand-500">Google</span>
                <span className="tabular-nums text-sand-700 font-medium">
                  {bGoogle.toLocaleString('fr-FR')} € ({Math.round((bGoogle / bTotal) * 100)}%)
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-sand-500">Meta</span>
                <span className="tabular-nums text-sand-700 font-medium">
                  {bMeta.toLocaleString('fr-FR')} € ({Math.round((bMeta / bTotal) * 100)}%)
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
