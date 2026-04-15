-- Migration: Ajout des colonnes de liaison comptes publicitaires
-- Date: 2026-04-15

ALTER TABLE real_estate_programs
    ADD COLUMN IF NOT EXISTS google_ads_customer_id text,
    ADD COLUMN IF NOT EXISTS meta_ads_account_id text;
