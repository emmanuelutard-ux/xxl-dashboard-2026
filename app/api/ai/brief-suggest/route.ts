import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  const googleActive = body.google_active !== false
  const metaActive   = body.meta_active   !== false
  const hasBrs       = body.has_brs       === true
  const budgetTotal  = (Number(body.budget_google) || 0) + (Number(body.budget_meta) || 0)
  const location     = body.location || ''
  const name         = body.name     || 'ce programme'

  const platforms = [googleActive && 'Google Ads', metaActive && 'Meta Ads'].filter(Boolean).join(' + ')

  const summary =
    `Programme ${name}${location ? ` à ${location}` : ''}. ` +
    `Budget total ${budgetTotal > 0 ? `${budgetTotal.toLocaleString('fr-FR')} €` : 'à valider'} ` +
    `sur ${platforms || 'plateformes à définir'}. ` +
    (hasBrs ? 'Dispositif BRS détecté : 2 segments de campagne recommandés. ' : '')

  const googleStrategy = googleActive
    ? `Search sur mots-clés programme neuf${location ? ` ${location}` : ''}. ` +
      (hasBrs ? '2 campagnes distinctes : accession classique + BRS. ' : '') +
      'Correspondance exacte + expression exacte uniquement. PMax envisageable après 2 mois de data.'
    : 'Non activé pour ce programme.'

  const metaStrategy = metaActive
    ? `Lead Gen ${hasBrs ? 'Volume (BRS) + Intention élevée (classique)' : 'Intention élevée'}. ` +
      'Formats 1:1 et Reels 9:16. Rayon géo 17 km.' +
      (hasBrs ? ' Exclure < 35 ans sur les T3/T4 marché libre.' : '')
    : 'Non activé pour ce programme.'

  const expectedCpl = budgetTotal >= 3000
    ? hasBrs ? '10–18 €' : '15–22 €'
    : 'À estimer (budget insuffisant pour la référence)'

  const timeline = body.google_start
    ? `Lancement ${new Date(body.google_start).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
    : 'Date de lancement à préciser'

  // Simule une latence IA réaliste
  await new Promise(r => setTimeout(r, 900))

  return NextResponse.json({
    summary,
    google_strategy: googleStrategy,
    meta_strategy:   metaStrategy,
    expected_cpl:    expectedCpl,
    timeline,
  })
}
