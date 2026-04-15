-- Migration: Ajout de la table google_ads_accounts
-- Date: 2026-04-15

CREATE TABLE IF NOT EXISTS google_ads_accounts (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id text NOT NULL UNIQUE,
    programme_id uuid REFERENCES real_estate_programs(id) ON DELETE SET NULL,
    nom         text NOT NULL,
    mcc_id      text NOT NULL DEFAULT '8667313568',
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamp with time zone DEFAULT now()
);

ALTER TABLE google_ads_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read google_ads_accounts" ON google_ads_accounts
    FOR SELECT TO authenticated USING (true);

-- Insertion des 4 comptes clients (programme_id null jusqu'à liaison avec les vrais IDs Supabase)
INSERT INTO google_ads_accounts (customer_id, nom, mcc_id, programme_id) VALUES
    ('8029188856', 'Résidence Galliéni — Siba (Nanterre)',   '8667313568', NULL),
    ('3081959996', 'Promenade Nodier — Corem (Pantin)',       '8667313568', NULL),
    ('3303140476', 'Bricklane — Bati-Paris (Bagneux)',        '8667313568', NULL),
    ('1927883223', 'Gentilly — AIC (Villemomble)',            '8667313568', NULL)
ON CONFLICT (customer_id) DO NOTHING;
