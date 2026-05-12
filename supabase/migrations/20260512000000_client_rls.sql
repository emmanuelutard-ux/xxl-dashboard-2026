-- Migration: RLS client-scoped pour l'espace promoteur
-- Date: 2026-05-12
-- Objectif: Restreindre l'accès des clients à leurs propres programmes uniquement.
--           Les rôles agency/expert conservent un accès total.
--
-- ATTENTION : cette migration SUPPRIME les policies "USING (true)" existantes
-- et les remplace par des policies discriminées par rôle (via la table profiles).

-- ─────────────────────────────────────────────────────────────────────────────
-- real_estate_programs
-- ─────────────────────────────────────────────────────────────────────────────

-- Supprimer la policy permissive existante
DROP POLICY IF EXISTS "Public read access for authenticated users" ON real_estate_programs;

-- Agency/expert : accès à tous les programmes
CREATE POLICY "agency_expert_read_programs"
  ON real_estate_programs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('agency', 'expert')
    )
  );

-- Client : accès uniquement aux programmes qui lui sont assignés
CREATE POLICY "client_read_own_programs"
  ON real_estate_programs
  FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid()
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- daily_ad_metrics
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public read access for authenticated users" ON daily_ad_metrics;

CREATE POLICY "agency_expert_read_metrics"
  ON daily_ad_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('agency', 'expert')
    )
  );

-- Client : accès aux métriques de ses propres programmes uniquement
CREATE POLICY "client_read_own_metrics"
  ON daily_ad_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM real_estate_programs
      WHERE real_estate_programs.id = program_id
        AND real_estate_programs.client_id = auth.uid()
    )
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- creative_assets
-- ─────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Public read access for authenticated users" ON creative_assets;

CREATE POLICY "agency_expert_read_assets"
  ON creative_assets
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('agency', 'expert')
    )
  );

-- Les clients n'ont pas accès aux créatifs (pas d'exposition dans l'espace client)
-- Policy non créée intentionnellement.
