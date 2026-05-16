import { NextRequest, NextResponse } from 'next/server'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcDays(start: unknown, end: unknown): number | null {
  if (!start || !end || typeof start !== 'string' || typeof end !== 'string') return null
  const days = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000)
  return days > 0 ? days : null
}

function fmtN(n: number): string {
  return Math.round(n).toLocaleString('fr-FR')
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))

  // ── Inputs ──────────────────────────────────────────────────────────────────
  const name          = String(body.name     || 'ce programme')
  const location      = String(body.location || '')
  const hasBrs        = body.has_brs === true
  const profiles      = Array.isArray(body.target_profiles) ? body.target_profiles as string[] : []
  const googleActive  = body.google_active !== false
  const metaActive    = body.meta_active   !== false
  const budgetGoogle  = Number(body.budget_google) || 0
  const budgetMeta    = Number(body.budget_meta)   || 0
  const googleStart   = body.google_start ?? null
  const googleEnd     = body.google_end   ?? null
  const metaStart     = body.meta_start   ?? null
  const metaEnd       = body.meta_end     ?? null
  const lpNotReady    = body.lp_not_ready === true
  const lpProvider    = String(body.lp_provider  || 'promoteur')
  const crmProvider   = String(body.crm_provider || 'aucun')
  const budgetTotal   = budgetGoogle + budgetMeta

  const gDays  = calcDays(googleStart, googleEnd)
  const mDays  = calcDays(metaStart,   metaEnd)
  const gDaily = gDays && budgetGoogle > 0 ? Math.round(budgetGoogle / gDays) : null
  const mDaily = mDays && budgetMeta   > 0 ? Math.round(budgetMeta   / mDays) : null

  const isPrimo        = hasBrs || profiles.includes('primo') || profiles.length === 0
  const isFamille      = profiles.includes('famille')
  const isInvestisseur = profiles.includes('investisseur')
  const isSenior       = profiles.includes('senior')
  const loc            = location ? ` ${location}` : ''

  // ── CPL benchmarks (ref. Gentilly Nov25–Fév26) ──────────────────────────────
  const googleCplRange = hasBrs ? '14–20 €' : isFamille || isInvestisseur ? '18–28 €' : '12–20 €'
  const metaCplRange   = hasBrs ? '10–14 €' : isFamille ? '15–20 €' : isInvestisseur ? '20–30 €' : '15–22 €'
  const gCplMid        = hasBrs ? 17 : isInvestisseur ? 23 : 16
  const mCplMid        = hasBrs ? 12 : isInvestisseur ? 25 : 18
  const gContacts      = budgetGoogle > 0 ? `~${fmtN(budgetGoogle / gCplMid)} contacts attendus` : null
  const mContacts      = budgetMeta   > 0 ? `~${fmtN(budgetMeta   / mCplMid)} contacts attendus` : null

  // ── Positioning ─────────────────────────────────────────────────────────────
  const profileLabel = hasBrs
    ? 'primo-accédants BRS + accession classique'
    : isFamille      ? 'familles actives en quête d\'espace et de cadre de vie'
    : isInvestisseur ? 'investisseurs patrimoniaux'
    : isSenior       ? 'seniors primo-accédants'
    : 'primo-accédants actifs'

  const summary =
    `Programme ${name}${loc} positionné pour ${profileLabel}. ` +
    `Budget total ${budgetTotal > 0 ? `${fmtN(budgetTotal)} €` : 'à valider'} réparti sur ` +
    `${[googleActive && 'Google Ads', metaActive && 'Meta Ads'].filter(Boolean).join(' + ') || 'régie à définir'}. ` +
    (hasBrs
      ? 'Dispositif BRS activé : 2 segments de campagnes recommandés (accession classique + BRS). La campagne BRS cible les primo-accédants en Lead Gen Volume pour maximiser les contacts à CPL réduit. '
      : '') +
    (lpNotReady
      ? 'Point d\'attention : landing page non finalisée. Le lancement doit être conditionné à la mise en production d\'une LP dédiée avec formulaire intégré.'
      : lpProvider === 'agency'
      ? 'Landing page Diffusez en place — tracking à vérifier avant lancement (Pixel Meta + Tag Google Ads conversion).'
      : '')

  const primaryAxis = hasBrs
    ? 'Accessibilité primo-accédants (BRS + accession libre)'
    : isFamille      ? 'Cadre de vie famille — espace, confort, environnement'
    : isInvestisseur ? 'Investissement patrimonial — rendement locatif ou défiscalisation'
    : isSenior       ? 'Simplification résidentielle — petite surface qualitative et fonctionnelle'
    : `Accession à la propriété — premier achat à${loc}`

  const keyMessage = hasBrs
    ? `Devenez propriétaire à${loc} à prix maîtrisé`
    : isFamille      ? `Un appartement à taille famille à${loc}`
    : isInvestisseur ? `Investir dans l'immobilier neuf à${loc}`
    : isSenior       ? `Un logement neuf adapté à votre vie à${loc}`
    : `Votre premier logement neuf à${loc}`

  const avoidMessages = hasBrs
    ? ['Discours sur la défiscalisation ou le rendement locatif', 'Comparaisons avec le marché de revente', 'Références à l\'investissement']
    : isInvestisseur
    ? ['Messages axés sur l\'accession principale ou l\'émotion famille', 'Références BRS ou aide sociale au logement', 'Termes "primo-accédant"']
    : isFamille
    ? ['Messages trop techniques sur le financement', 'Références aux studios ou petites surfaces', 'Termes "location" ou "loyer"']
    : ['Messages trop techniques sur les dispositifs fiscaux', 'Références HLM ou logement social', 'Termes "location", "loyer", "investissement"']

  // ── Google ───────────────────────────────────────────────────────────────────
  const googleCampaigns = googleActive ? (hasBrs ? [
    {
      name: `Search — Accession classique${loc}`,
      match_type: 'Exact + Expression exacte',
      budget_share: '60% budget Google',
      keywords_examples: [
        `"achat appartement neuf${loc}"`,
        `"programme immobilier neuf${loc}"`,
        `"logement neuf${loc}"`,
      ],
    },
    {
      name: `Search — BRS${loc}`,
      match_type: 'Exact + Expression exacte',
      budget_share: '40% budget Google',
      keywords_examples: [
        `"bail réel solidaire${loc}"`,
        `"appartement BRS${loc}"`,
        `"achat logement prix maîtrisé${loc}"`,
      ],
    },
  ] : [
    {
      name: `Search — ${isFamille ? 'Familles' : isInvestisseur ? 'Investissement' : 'Primo-accédants'}${loc}`,
      match_type: 'Exact + Expression exacte',
      budget_share: '100% budget Google',
      keywords_examples: isInvestisseur
        ? [`"investissement immobilier neuf${loc}"`, `"achat appartement locatif${loc}"`, `"programme neuf Pinel${loc}"`]
        : isFamille
        ? [`"achat appartement T3 T4${loc}"`, `"logement neuf famille${loc}"`, `"programme immobilier${loc}"`]
        : [`"achat appartement neuf${loc}"`, `"programme neuf primo-accédant${loc}"`, `"logement neuf PTZ${loc}"`],
    },
  ]) : []

  const negativeKeywords = [
    'louer', 'location', 'loyer', 'hlm', 'logement social',
    '3F', 'erilia', 'batigère', 'colocation', 'meublé',
    'ancien', 'viager', 'résidence tourisme', 'saisonnier',
  ]

  const biddingStrategy = gDays && gDays <= 60
    ? 'Max Conversions (phase apprentissage mois 1-2). Basculer vers Target CPA après 30 conversions.'
    : 'Target CPA si historique conversions > 30 disponible, sinon Max Conversions.'

  const lpReco = lpNotReady
    ? 'BLOQUANT avant lancement : préparer une LP dédiée Diffusez avec formulaire de contact intégré (pas de redirection vers site promoteur générique).'
    : lpProvider === 'promoteur'
    ? 'Recommandé : remplacer la page promoteur par une LP Diffusez dédiée. Le taux de rebond sur pages génériques est 2-3× plus élevé qu\'une LP optimisée.'
    : 'LP Diffusez en place. Vérifier Pixel Meta + Tag Google Ads + GA4 avant activation des campagnes.'

  // ── Meta ─────────────────────────────────────────────────────────────────────
  const metaAudiences = metaActive ? (hasBrs ? [
    {
      name: 'BRS — Primo-accédants modestes',
      targeting: `35–55 ans. Intérêts : "Premier achat immobilier", "Aide accession propriété", "PTZ". Exclusion : "Investissement locatif", "Location immobilière". Rayon 17 km centré sur${loc || ' le programme'}.`,
      budget_share: '50% budget Meta',
      creative_format: 'Reels 9:16 + Stories 9:16',
    },
    {
      name: 'Accession classique — Actifs',
      targeting: `30–55 ans. Intérêts : "Achat immobilier", "Crédit immobilier". Exclusion : "Location", "HLM". Rayon 17 km.`,
      budget_share: '50% budget Meta',
      creative_format: 'Reels 9:16 + 1:1',
    },
  ] : isFamille ? [
    {
      name: 'Familles — T3/T4 recherchés',
      targeting: `35–55 ans. Intérêts : "Achat immobilier", "Maison familiale". Exclusion < 35 ans (T3/T4 marché libre). Rayon 17 km.`,
      budget_share: '70% budget Meta',
      creative_format: 'Reels 9:16 + 1:1',
    },
    {
      name: 'Parents actifs — upgrade résidentiel',
      targeting: `38–55 ans. Comportements : "Propriétaire envisage déménagement". Rayon 17 km.`,
      budget_share: '30% budget Meta',
      creative_format: 'Stories 9:16',
    },
  ] : isInvestisseur ? [
    {
      name: 'Investisseurs patrimoniaux',
      targeting: `35–65 ans. Intérêts : "Investissement immobilier", "Défiscalisation", "Pinel". Rayon élargi 40 km (distance tolérée pour investissement).`,
      budget_share: '80% budget Meta',
      creative_format: '1:1 + Reels 9:16',
    },
    {
      name: 'Lookalike clients existants',
      targeting: 'Lookalike 1% sur base clients promoteur si disponible. Sinon : 35–65 ans, sans intérêt spécifique (audience large).',
      budget_share: '20% budget Meta',
      creative_format: '1:1',
    },
  ] : [
    {
      name: `Primo-accédants actifs${loc}`,
      targeting: `28–45 ans. Intérêts : "Premier achat immobilier", "Crédit immobilier", "PTZ". Exclusion : "Investissement locatif". Rayon 17 km.`,
      budget_share: '70% budget Meta',
      creative_format: 'Reels 9:16 + Stories 9:16',
    },
    {
      name: 'Accédants upgrade',
      targeting: `35–50 ans. Comportements : "Propriétaire envisage déménagement". Rayon 17 km.`,
      budget_share: '30% budget Meta',
      creative_format: '1:1',
    },
  ]) : []

  const metaObjective = hasBrs || isPrimo
    ? 'Lead Gen — Volume (CPL optimisé, priorité quantité)'
    : 'Lead Gen — Intention élevée (MQL prioritaire)'

  const creativeRecos = [
    'Hero visuel : façade du programme ou vue terrasse aménagée — fond clair, pas de texte chargé en surimpression',
    `Texte overlay court : USP principale en 5-7 mots + badge "Neuf" ou "BRS disponible" si applicable`,
    'CTA : "Je veux en savoir plus" > "Acheter" en immobilier — taux de clic +15% observé sur ce wording',
    'Format Reels 9:16 en 1er split test : CPL moyen 10,88 € (vs 13,57 € Stories) — ref. Gentilly Nov25–Fév26',
  ]

  // ── Timing ───────────────────────────────────────────────────────────────────
  const timingReco = {
    phase_1: 'Mois 1-2 : Max Conversions + audience large — phase apprentissage algorithme. CPL attendu > cible pendant 2-3 semaines (normal). Volume avant qualité.',
    phase_2: 'Mois 2-3 : Réduire les audiences sous-performantes. Basculer Meta sur Lead Gen Intention si data CRM disponible. Tester Target CPA sur Google si > 30 conversions.',
    phase_3: 'Mois 3+ : Target CPL MQL si pipeline CRM connecté. Couper créas < 2% CTR. Activer PMax Google si > 30 conversions/mois et budget Google > 1 500 €.',
  }

  // ── Risques ──────────────────────────────────────────────────────────────────
  const risks = [
    `CPL initial probable > cible pendant les 2-3 premières semaines (phase apprentissage). Prévoir budget tampon ${budgetTotal > 0 ? `(~${fmtN(budgetTotal * 0.15)} €)` : ''}.`,
    ...(lpNotReady ? ['Landing page non finalisée : aucun lancement possible sans LP opérationnelle avec formulaire de contact fonctionnel.'] : []),
    ...(crmProvider === 'aucun' ? ['Sans CRM intégré, attribution Meta limitée. Prévoir Zapier → Google Sheets pour le tracking manuel des contacts reçus.'] : []),
    'Qualification des contacts : sans rappel dans les 4h, le taux de MQL chute de 60% (benchmark secteur immobilier neuf).',
    ...(hasBrs ? ['Campagne BRS : vérifier l\'éligibilité géographique BRS (zones B2/C uniquement) avant lancement pour éviter les contacts hors cible.'] : []),
  ]

  // ── Next steps ────────────────────────────────────────────────────────────────
  const nextSteps = [
    lpNotReady
      ? 'PRIORITÉ : Finaliser la landing page avec formulaire de contact intégré (Diffusez recommandé)'
      : 'Vérifier le tracking LP : Pixel Meta + Tag Google Ads conversion + GA4 event "generate_lead"',
    'Récupérer accès admin Meta Business Manager + Google Ads auprès du promoteur',
    'Préparer pack créa : 4-6 visuels 1:1 (1080×1080) + 2-3 Reels/Stories 9:16 (1080×1920)',
    crmProvider !== 'aucun'
      ? `Configurer l'intégration CRM ${crmProvider} pour l'attribution automatique des contacts`
      : 'Mettre en place un Google Sheet de tracking contacts (colonnes : source / date / nom / statut)',
    ...(hasBrs ? ['Préparer les éléments de communication BRS : conditions d\'accès, économies vs marché libre, calcul mensualités'] : []),
    'Planifier un point de pilotage J+14 après lancement pour les premiers ajustements d\'enchères',
  ]

  await new Promise(r => setTimeout(r, 900))

  return NextResponse.json({
    summary,
    positioning: { primary_axis: primaryAxis, key_message: keyMessage, avoid_messages: avoidMessages },
    google: {
      enabled:    googleActive,
      budget:     budgetGoogle,
      daily_budget: gDaily,
      strategy:   googleActive
        ? `Campagnes Search sur mots-clés d'intention directe : programme neuf${loc}, achat appartement neuf, accession propriété. ${hasBrs ? 'Segmentation en 2 campagnes distinctes (BRS + classique) pour optimiser les budgets indépendamment. ' : ''}Correspondance exacte + expression exacte uniquement — jamais de requête large, jamais de PMax avant 2 mois de données.`
        : 'Google Ads non activé pour ce programme.',
      campaign_structure: googleCampaigns,
      negative_keywords:  googleActive ? negativeKeywords : [],
      bidding_strategy:   biddingStrategy,
      landing_page_recommendation: lpReco,
      expected_cpl:      googleActive && budgetGoogle > 0 ? googleCplRange : null,
      expected_contacts: googleActive && gContacts ? gContacts : null,
    },
    meta: {
      enabled:     metaActive,
      budget:      budgetMeta,
      daily_budget: mDaily,
      strategy:    metaActive
        ? `${metaObjective}. ${hasBrs ? 'Campagne BRS en Volume pour maximiser les contacts primo-accédants, campagne accession classique en Intention élevée pour prioriser la qualité. ' : ''}Formats 9:16 en priorité — benchmark Gentilly : CPL Reels 10,88 € vs Stories 13,57 €.`
        : 'Meta Ads non activé pour ce programme.',
      objective:   metaObjective,
      audiences:   metaAudiences,
      creative_recommendations: metaActive ? creativeRecos : [],
      radius:      17,
      radius_note: 'Imposé par Meta pour les annonces immobilières depuis déc. 2023 (non négociable)',
      expected_cpl:      metaActive && budgetMeta > 0 ? metaCplRange : null,
      expected_contacts: metaActive && mContacts ? mContacts : null,
    },
    timing_recommendation: timingReco,
    risks_and_alerts: risks,
    next_steps: nextSteps,
  })
}
