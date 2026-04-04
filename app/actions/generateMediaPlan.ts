'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase'
import { PLAN_MEDIA_SYSTEM_PROMPT, buildPlanMediaUserPrompt } from '@/utils/prompts/plan-media'

export interface MediaPlanPersona {
  nom: string
  age_range: string
  description: string
  point_de_douleur: string
  canal_privilegie: string
}

export interface MediaPlanUVP {
  accroche: string
  arguments_vente: [string, string, string]
  angle_creatif: string
}

export interface MediaPlanPhase {
  nom: string
  duree: string
  objectif: string
  budget_google: number
  budget_meta: number
}

export interface MediaPlanCampagne {
  canal: 'google' | 'meta'
  nom: string
  type_accession: 'classique' | 'brs'
  budget: number
  budget_quotidien: number // calculé côté serveur
  mots_cles: string[] | null
  ciblage: string | null
  format: string | null
  type_lead_gen: string | null
  recommandation_structure: string | null // généré par Claude si budget/jour < 40 €
}

export interface MediaPlanChecklist {
  titre: string
  description: string
  responsable: 'expert' | 'agence' | 'diffusez'
  priorite: 'haute' | 'moyenne' | 'basse'
}

export interface MediaPlan {
  personas: MediaPlanPersona[]
  uvp: MediaPlanUVP
  phases: MediaPlanPhase[]
  campagnes: MediaPlanCampagne[]
  checklist: MediaPlanChecklist[]
  cpl_cible: number
  notes_strategie: string
}

export async function generateMediaPlan(
  programId: string
): Promise<{ success: boolean; error?: string; plan?: MediaPlan }> {
  const supabase = createClient()

  // 1. Récupérer le programme
  const { data: program, error: fetchError } = await supabase
    .from('real_estate_programs')
    .select('name, location, budget_google, budget_meta, has_brs, lot_count, landing_page_url, crm_provider, brief_data')
    .eq('id', programId)
    .single()

  if (fetchError || !program) {
    return { success: false, error: fetchError?.message ?? 'Programme introuvable.' }
  }

  // 2. Appel Anthropic
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { success: false, error: 'Clé API Anthropic manquante.' }
  }

  const anthropic = new Anthropic({ apiKey })

  let rawContent: string
  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: PLAN_MEDIA_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildPlanMediaUserPrompt(program as Parameters<typeof buildPlanMediaUserPrompt>[0]),
        },
      ],
    })

    const block = message.content[0]
    if (block.type !== 'text') {
      return { success: false, error: 'Réponse inattendue du modèle.' }
    }
    rawContent = block.text
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur API Anthropic.'
    console.error('Erreur Anthropic:', msg)
    return { success: false, error: msg }
  }

  // 3. Parser le JSON retourné par Claude
  let plan: MediaPlan
  try {
    const cleaned = rawContent.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    plan = JSON.parse(cleaned)
  } catch {
    console.error('JSON invalide reçu de Claude:', rawContent)
    return { success: false, error: "Le plan média généré n'est pas un JSON valide." }
  }

  // 4. Calcul du budget quotidien pour chaque campagne (côté serveur)
  const brief = program.brief_data as Record<string, unknown> | null
  const dureeJours = Number(brief?.campaign_duration_days) || 90

  plan.campagnes = plan.campagnes.map((c) => ({
    ...c,
    budget_quotidien: Math.round((c.budget / dureeJours) * 100) / 100,
  }))

  // 5. Sauvegarder dans Supabase
  const { error: updateError } = await supabase
    .from('real_estate_programs')
    .update({
      ai_media_plan: plan,
      brief_completed_at: new Date().toISOString(),
      status: 'active',
    })
    .eq('id', programId)

  if (updateError) {
    console.error('Erreur sauvegarde plan média:', updateError)
    return { success: false, error: updateError.message }
  }

  return { success: true, plan }
}
