-- Migration: Ajout du statut "live" pour real_estate_programs
-- Date: 2026-04-02

ALTER TABLE real_estate_programs
    DROP CONSTRAINT IF EXISTS real_estate_programs_status_check;

ALTER TABLE real_estate_programs
    ADD CONSTRAINT real_estate_programs_status_check
    CHECK (status IN ('brief', 'active', 'paused', 'validated', 'live', 'archived'));
