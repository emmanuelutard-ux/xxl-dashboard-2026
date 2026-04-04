-- Fix Agency Data: Remove ghost program and add campaign dates
-- Date: 2026-02-04

-- 1. Delete ghost program
DELETE FROM real_estate_programs WHERE id::text LIKE 'cfbe0404%';

-- 2. Add Date Columns
DO $$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'real_estate_programs' AND column_name = 'start_date') THEN
        ALTER TABLE real_estate_programs ADD COLUMN start_date DATE;
    END IF;
    
    IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'real_estate_programs' AND column_name = 'end_date') THEN
        ALTER TABLE real_estate_programs ADD COLUMN end_date DATE;
    END IF;
END $$;

-- 3. Update existing programs with realistic dates

-- Résidence Les Jardins de la Gare (Active)
UPDATE real_estate_programs 
SET start_date = '2026-01-01', end_date = '2026-03-31' 
WHERE name = 'Résidence Les Jardins de la Gare';

-- Résidence Les Cèdres (Small budget)
UPDATE real_estate_programs 
SET start_date = '2026-01-15', end_date = '2026-04-15' 
WHERE name = 'Résidence Les Cèdres';

-- Tour Horizon (Big budget)
UPDATE real_estate_programs 
SET start_date = '2026-02-01', end_date = '2026-06-30' 
WHERE name = 'Tour Horizon';
