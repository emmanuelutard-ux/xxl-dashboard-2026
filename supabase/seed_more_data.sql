-- SEED DATA FOR REMAINING PROGRAMS
-- Usage: Execute this in Supabase SQL Editor to populate data for "Résidence Les Cèdres" and "Tour Horizon"

DO $$
DECLARE
    cedres_id uuid;
    horizon_id uuid;
    curr_date date;
    i integer;
    
    -- Variables for random data generation
    v_spend numeric;
    v_impressions int;
    v_clicks int;
    v_leads_platform int;
    v_leads_ga4 int;
BEGIN
    -- 1. Get Program IDs (assuming they exist from previous migrations)
    -- If not, we skip safely
    SELECT id INTO cedres_id FROM real_estate_programs WHERE name = 'Résidence Les Cèdres' LIMIT 1;
    SELECT id INTO horizon_id FROM real_estate_programs WHERE name = 'Tour Horizon' LIMIT 1;

    -- Clean old metrics for these specific programs to avoid dupes
    IF cedres_id IS NOT NULL THEN
        DELETE FROM daily_ad_metrics WHERE program_id = cedres_id;
    END IF;
    
    IF horizon_id IS NOT NULL THEN
        DELETE FROM daily_ad_metrics WHERE program_id = horizon_id;
    END IF;

    -- 2. Loop for 30 days
    FOR i IN 0..29 LOOP
        curr_date := (CURRENT_DATE - INTERVAL '29 days') + (i || ' days')::interval;

        --------------------------------------------------------
        -- PROGRAM 1: Résidence Les Cèdres (Small Budget ~30€)
        --------------------------------------------------------
        IF cedres_id IS NOT NULL THEN
            -- Randomize daily stats
            v_spend := 25 + floor(random() * 10); -- 25-35€
            v_impressions := 300 + floor(random() * 200);
            v_clicks := floor(v_impressions * 0.05); -- ~5% CTR
            
            -- Leads are rare (0-2)
            v_leads_platform := floor(random() * 3); -- 0, 1, or 2
            -- GA4 even rarer
             v_leads_ga4 := CASE 
                WHEN v_leads_platform > 0 AND random() > 0.3 THEN v_leads_platform - 1 
                ELSE v_leads_platform 
            END;

            INSERT INTO daily_ad_metrics (program_id, date, platform, impressions, clicks, spend, platform_conversions, ga4_conversions)
            VALUES (cedres_id, curr_date, 'meta', v_impressions, v_clicks, v_spend, v_leads_platform, v_leads_ga4);
        END IF;

        --------------------------------------------------------
        -- PROGRAM 2: Tour Horizon (Big Budget ~100€)
        --------------------------------------------------------
        IF horizon_id IS NOT NULL THEN
             -- Randomize daily stats (Higher Volume)
            v_spend := 90 + floor(random() * 30); -- 90-120€
            v_impressions := 2000 + floor(random() * 1000);
            v_clicks := floor(v_impressions * 0.03); -- ~3% CTR (lower ctr often on high vol)
            
            -- Leads are frequent (3-8)
            v_leads_platform := 3 + floor(random() * 6); -- 3 to 8
            
            -- GA4 discrepancy (usually 20% less)
            v_leads_ga4 := floor(v_leads_platform * (0.7 + random() * 0.2)); 

            INSERT INTO daily_ad_metrics (program_id, date, platform, impressions, clicks, spend, platform_conversions, ga4_conversions)
            VALUES (horizon_id, curr_date, 'google', v_impressions, v_clicks, v_spend, v_leads_platform, v_leads_ga4);
        END IF;

    END LOOP;
END $$;
