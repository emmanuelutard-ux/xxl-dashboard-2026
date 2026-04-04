-- Migration: Enrichissement de real_estate_programs pour le Sprint 1
-- Date: 2026-04-02
-- Objectif: Ajouter les colonnes métier prioritaires (brief, IA, budget, BRS, CRM)
--            et corriger les valeurs autorisées pour le champ status.

-- ─────────────────────────────────────────────────────────────
-- 1. NOUVELLES COLONNES
-- ─────────────────────────────────────────────────────────────

-- Promoteur client associé au programme
ALTER TABLE real_estate_programs
    ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Localisation du programme (ville / adresse)
ALTER TABLE real_estate_programs
    ADD COLUMN IF NOT EXISTS location text;

-- Présence de lots BRS → déclenche règles métier spécifiques (2 campagnes, Lead Gen Volume)
ALTER TABLE real_estate_programs
    ADD COLUMN IF NOT EXISTS has_brs boolean NOT NULL DEFAULT false;

-- Nombre de lots total (suivi commercialisation)
ALTER TABLE real_estate_programs
    ADD COLUMN IF NOT EXISTS lot_count integer;

-- Budgets par plateforme (Google Ads / Meta)
ALTER TABLE real_estate_programs
    ADD COLUMN IF NOT EXISTS budget_google numeric DEFAULT 0;

ALTER TABLE real_estate_programs
    ADD COLUMN IF NOT EXISTS budget_meta numeric DEFAULT 0;

-- CPL cible du programme (référence pour alertes et reporting)
ALTER TABLE real_estate_programs
    ADD COLUMN IF NOT EXISTS target_cpl numeric;

-- Données brutes du brief rempli par l'agence (formulaire Sprint 1)
ALTER TABLE real_estate_programs
    ADD COLUMN IF NOT EXISTS brief_data jsonb;

-- Plan média généré par l'IA Anthropic (stockage structuré)
ALTER TABLE real_estate_programs
    ADD COLUMN IF NOT EXISTS ai_media_plan jsonb;

-- Horodatage de validation du brief → déclenche la génération IA
ALTER TABLE real_estate_programs
    ADD COLUMN IF NOT EXISTS brief_completed_at timestamp with time zone;

-- CRM du promoteur (ex. 'unlatch' pour Bati-Paris)
ALTER TABLE real_estate_programs
    ADD COLUMN IF NOT EXISTS crm_provider text;

-- URL de la landing page du programme
ALTER TABLE real_estate_programs
    ADD COLUMN IF NOT EXISTS landing_page_url text;


-- ─────────────────────────────────────────────────────────────
-- 2. CORRECTION DES VALEURS AUTORISÉES POUR status
--
--    Avant : CHECK (status IN ('active', 'archived'))
--    Après : CHECK (status IN ('brief', 'active', 'paused', 'archived'))
--
--    'brief'    → programme créé, brief en cours de remplissage
--    'active'   → campagnes en cours
--    'paused'   → campagnes pausées temporairement
--    'archived' → programme terminé
-- ─────────────────────────────────────────────────────────────

-- Ramener les valeurs hors périmètre vers un état valide avant de changer la contrainte
UPDATE real_estate_programs
    SET status = 'active'
    WHERE status NOT IN ('brief', 'active', 'paused', 'archived');

-- Supprimer l'ancienne contrainte CHECK (nom généré automatiquement par PostgreSQL)
ALTER TABLE real_estate_programs
    DROP CONSTRAINT IF EXISTS real_estate_programs_status_check;

-- Ajouter la nouvelle contrainte avec les 4 valeurs métier
ALTER TABLE real_estate_programs
    ADD CONSTRAINT real_estate_programs_status_check
    CHECK (status IN ('brief', 'active', 'paused', 'archived'));
