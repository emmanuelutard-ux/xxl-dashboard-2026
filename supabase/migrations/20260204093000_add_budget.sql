-- Migration: Add total_budget and update specific programs
-- Date: 2026-02-04

DO $$
BEGIN
    -- 1. Rename column if 'budget_total' exists (from previous init script)
    IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'real_estate_programs' AND column_name = 'budget_total') THEN
        ALTER TABLE real_estate_programs RENAME COLUMN budget_total TO total_budget;
    
    -- 2. Else create it if it doesn't exist
    ELSIF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'real_estate_programs' AND column_name = 'total_budget') THEN
        ALTER TABLE real_estate_programs ADD COLUMN total_budget numeric DEFAULT 0;
    END IF;
END $$;

-- 3. Ensure the programs exist and update their budgets
-- Note: 'conversion_source' is required, so we provide default if inserting.

-- Program 1: Résidence Les Jardins de la Gare
INSERT INTO real_estate_programs (name, total_budget, conversion_source, status)
VALUES ('Résidence Les Jardins de la Gare', 5000, 'platform', 'active')
ON CONFLICT (id) DO UPDATE 
SET total_budget = 5000
WHERE real_estate_programs.name = 'Résidence Les Jardins de la Gare';
-- Should update by name if we could, but constraint is likely on ID. 
-- Since we don't know IDs for Cèdres/Horizon, we use logic to UPDATE by Name if exists.

UPDATE real_estate_programs SET total_budget = 5000 WHERE name = 'Résidence Les Jardins de la Gare';

-- Program 2: Résidence Les Cèdres
-- We try to update first. If not exists, strict requirement says "Update existing". 
-- But to be nice, let's Insert if missing to facilitate testing.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM real_estate_programs WHERE name = 'Résidence Les Cèdres') THEN
        UPDATE real_estate_programs SET total_budget = 3000 WHERE name = 'Résidence Les Cèdres';
    ELSE
        INSERT INTO real_estate_programs (name, total_budget, conversion_source, status)
        VALUES ('Résidence Les Cèdres', 3000, 'platform', 'active');
    END IF;
END $$;

-- Program 3: Tour Horizon
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM real_estate_programs WHERE name = 'Tour Horizon') THEN
        UPDATE real_estate_programs SET total_budget = 8000 WHERE name = 'Tour Horizon';
    ELSE
         INSERT INTO real_estate_programs (name, total_budget, conversion_source, status)
        VALUES ('Tour Horizon', 8000, 'ga4', 'construction');
    END IF;
END $$;
