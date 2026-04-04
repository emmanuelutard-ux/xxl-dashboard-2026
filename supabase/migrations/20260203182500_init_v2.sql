-- Migration generated for XXL Dashboard Evolution
-- Date: 2026-02-03
-- Purpose: Support Multi-Role, Real Estate Programs, and Dual Source Tracking

-- 1. UPDATE profiles (if exists, or create basic structure if starting fresh)
-- We assume 'profiles' exists from standard Supabase Auth starters, but we add the column safely.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        -- Create a basic profiles table linked to auth.users if it doesn't exist
        CREATE TABLE profiles (
            id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
            email text,
            full_name text
        );
    END IF;
END $$;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role text DEFAULT 'client' CHECK (role IN ('client', 'agency', 'expert'));

-- 2. NEW TABLE: real_estate_programs
CREATE TABLE IF NOT EXISTS real_estate_programs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    budget_total numeric DEFAULT 0,
    start_date date,
    end_date date,
    conversion_source text NOT NULL DEFAULT 'platform' CHECK (conversion_source IN ('platform', 'ga4')),
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for programs (basic policy: accessible by authenticated users for now)
ALTER TABLE real_estate_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for authenticated users" ON real_estate_programs
    FOR SELECT TO authenticated USING (true);


-- 3. NEW TABLE: daily_ad_metrics
CREATE TABLE IF NOT EXISTS daily_ad_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id uuid REFERENCES real_estate_programs(id) ON DELETE CASCADE,
    date date NOT NULL,
    platform text NOT NULL CHECK (platform IN ('google', 'meta')),
    impressions numeric DEFAULT 0,
    clicks numeric DEFAULT 0,
    spend numeric DEFAULT 0,
    platform_conversions int DEFAULT 0,
    ga4_conversions int DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (program_id, date, platform)
);

ALTER TABLE daily_ad_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for authenticated users" ON daily_ad_metrics
    FOR SELECT TO authenticated USING (true);


-- 4. NEW TABLE: creative_assets
CREATE TABLE IF NOT EXISTS creative_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id uuid REFERENCES real_estate_programs(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('image', 'video', 'pdf')),
    url text NOT NULL,
    status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'submitted', 'validated')),
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE creative_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for authenticated users" ON creative_assets
    FOR SELECT TO authenticated USING (true);

-- Optional: Create some dummy programs if table is empty
INSERT INTO real_estate_programs (name, status, budget_total, conversion_source)
SELECT 'Résidence Les Cèdres', 'active', 15000, 'platform'
WHERE NOT EXISTS (SELECT 1 FROM real_estate_programs);

INSERT INTO real_estate_programs (name, status, budget_total, conversion_source)
SELECT 'Tour Horizon', 'construction', 50000, 'ga4'
WHERE NOT EXISTS (SELECT 1 FROM real_estate_programs WHERE name = 'Tour Horizon');
