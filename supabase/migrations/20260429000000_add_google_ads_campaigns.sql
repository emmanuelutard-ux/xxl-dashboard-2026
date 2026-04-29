-- Liaison explicite N campagnes Google Ads ↔ 1 programme
-- Remplace le filtre implicite "toutes les campagnes du compte"
-- par une liste blanche de campaign_id par programme.
--
-- google_ads_accounts.programme_id est conservée intentionnellement
-- pour rétrocompatibilité — elle sera retirée dans une migration ultérieure.

CREATE TABLE IF NOT EXISTS google_ads_campaigns (
    id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id  text    NOT NULL UNIQUE,
    account_id   uuid    NOT NULL REFERENCES google_ads_accounts(id) ON DELETE CASCADE,
    programme_id uuid    NOT NULL REFERENCES real_estate_programs(id) ON DELETE CASCADE,
    nom          text    NOT NULL,
    type         text,                        -- 'SEARCH', 'PERFORMANCE_MAX', 'DISPLAY', etc.
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamp with time zone DEFAULT now(),

);

CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_programme_id
    ON google_ads_campaigns (programme_id);

CREATE INDEX IF NOT EXISTS idx_google_ads_campaigns_account_id
    ON google_ads_campaigns (account_id);
