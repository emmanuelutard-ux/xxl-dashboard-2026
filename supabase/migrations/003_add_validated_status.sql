-- Migration: Ajout du statut "validated" pour real_estate_programs
-- Date: 2026-04-02

-- Mettre à jour la contrainte CHECK pour autoriser le nouveau statut
ALTER TABLE real_estate_programs
    DROP CONSTRAINT IF EXISTS real_estate_programs_status_check;

ALTER TABLE real_estate_programs
    ADD CONSTRAINT real_estate_programs_status_check
    CHECK (status IN ('brief', 'active', 'paused', 'archived', 'validated'));
