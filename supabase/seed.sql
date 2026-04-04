-- SEED DATA FOR XXL DASHBOARD
-- Usage: Copy/Paste this content into the Supabase SQL Editor and Run.

-- 1. USERS (Mocks)
-- Note: Inserting into auth.users requires elevated privileges (service_role). 
-- If this fails on Supabase Cloud, create users manually in the Auth dashboard 
-- and update the UUIDs below in the 'profiles' insert.

DO $$
BEGIN
    -- CLIENT USER
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'client@xxl.com') THEN
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (
            'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Fixed UUID
            'authenticated',
            'authenticated',
            'client@xxl.com',
            crypt('password123', gen_salt('bf')), -- Password: password123
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            now(),
            now()
        );
    END IF;

    -- AGENCY USER
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'agency@xxl.com') THEN
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (
            'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', -- Fixed UUID
            'authenticated',
            'authenticated',
            'agency@xxl.com',
            crypt('password123', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            now(),
            now()
        );
    END IF;

    -- EXPERT USER
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'expert@xxl.com') THEN
        INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES (
            'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', -- Fixed UUID
            'authenticated',
            'authenticated',
            'expert@xxl.com',
            crypt('password123', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            now(),
            now()
        );
    END IF;
END $$;

-- 2. PROFILES
-- Link the auth users to their roles
INSERT INTO public.profiles (id, email, full_name, role)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'client@xxl.com', 'M. Promoteur', 'client'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'agency@xxl.com', 'Sarah Agence', 'agency'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'expert@xxl.com', 'Marc Expert', 'expert')
ON CONFLICT (id) DO UPDATE 
SET role = EXCLUDED.role;


-- 3. REAL ESTATE PROGRAM
-- We use a fixed UUID for the program to easily link metrics
INSERT INTO public.real_estate_programs (id, name, status, budget_total, start_date, end_date, conversion_source)
VALUES (
    'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    'Résidence Les Jardins de la Gare',
    'active',
    5000,
    CURRENT_DATE - INTERVAL '29 days', -- Starts 30 days ago
    CURRENT_DATE,
    'platform'
)
ON CONFLICT (id) DO NOTHING;


-- 4. DAILY METRICS GENERATION
-- Cleaning old metrics for this program to avoid duplicates/mess during re-seed
DELETE FROM public.daily_ad_metrics WHERE program_id = 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';

-- Generating 30 days of data
DO $$
DECLARE
    p_id uuid := 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
    curr_date date := CURRENT_DATE - INTERVAL '29 days';
    i integer;
    
    -- Variables for random data
    v_impressions_google int;
    v_clicks_google int;
    v_spend_google numeric;
    v_conv_platform_google int;
    v_conv_ga4_google int;
    
    v_impressions_meta int;
    v_clicks_meta int;
    v_spend_meta numeric;
    v_conv_platform_meta int;
    v_conv_ga4_meta int;
BEGIN
    FOR i IN 0..29 LOOP
        curr_date := (CURRENT_DATE - INTERVAL '29 days') + (i || ' days')::interval;

        -- GOOGLE DATA
        v_impressions_google := floor(random() * (1200 - 800 + 1) + 800);
        v_clicks_google := floor(v_impressions_google * (random() * (0.08 - 0.04) + 0.04)); -- ~4-8% CTR
        v_spend_google := floor(v_clicks_google * (random() * (1.5 - 0.8) + 0.8)); -- ~0.8-1.5 CPC
        v_conv_platform_google := floor(v_clicks_google * (random() * (0.12 - 0.08) + 0.08)); -- ~8-12% Conv
        v_conv_ga4_google := floor(v_conv_platform_google * 0.8); -- GA4 slightly lower

        INSERT INTO public.daily_ad_metrics (program_id, date, platform, impressions, clicks, spend, platform_conversions, ga4_conversions)
        VALUES (p_id, curr_date, 'google', v_impressions_google, v_clicks_google, v_spend_google, v_conv_platform_google, v_conv_ga4_google);

        -- META DATA
        v_impressions_meta := floor(random() * (3000 - 2000 + 1) + 2000);
        v_clicks_meta := floor(v_impressions_meta * (random() * (0.02 - 0.01) + 0.01)); -- ~1-2% CTR
        v_spend_meta := floor(v_clicks_meta * (random() * (0.9 - 0.5) + 0.5)); -- ~0.5-0.9 CPC
        v_conv_platform_meta := floor(v_clicks_meta * (random() * (0.06 - 0.03) + 0.03)); -- ~3-6% Conv
        v_conv_ga4_meta := floor(v_conv_platform_meta * 0.75); -- GA4 even lower for Meta often

        INSERT INTO public.daily_ad_metrics (program_id, date, platform, impressions, clicks, spend, platform_conversions, ga4_conversions)
        VALUES (p_id, curr_date, 'meta', v_impressions_meta, v_clicks_meta, v_spend_meta, v_conv_platform_meta, v_conv_ga4_meta);
        
    END LOOP;
END $$;
