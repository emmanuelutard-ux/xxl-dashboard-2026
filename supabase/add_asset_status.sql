-- Add/Update Status column for Creative Assets
-- Terminologies: 'pending', 'approved', 'rejected'

-- 1. Loosen restrictions if they exist (drop old check constraint)
ALTER TABLE creative_assets DROP CONSTRAINT IF EXISTS creative_assets_status_check;

-- 2. Ensure column exists (it should) and set default
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'creative_assets' AND column_name = 'status') THEN
        ALTER TABLE creative_assets ADD COLUMN status text DEFAULT 'pending';
    ELSE
        ALTER TABLE creative_assets ALTER COLUMN status SET DEFAULT 'pending';
    END IF;
END $$;

-- 3. Add new flexible constraint (optional, but good practice if we want to enforce these 3 values)
-- We won't add a hard constraint now to avoid conflict with existing 'submitted'/'validated' unless we convert them.
-- Let's convert them first.

UPDATE creative_assets SET status = 'approved' WHERE status = 'validated';
UPDATE creative_assets SET status = 'pending' WHERE status = 'proposed' OR status = 'submitted';

-- Now we can add the check constraint safely
ALTER TABLE creative_assets ADD CONSTRAINT creative_assets_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected'));

-- 4. Randomly approve a few more for testing variety
UPDATE creative_assets 
SET status = 'approved' 
WHERE id IN (
    SELECT id FROM creative_assets 
    WHERE status = 'pending' 
    ORDER BY random() 
    LIMIT 2
);

UPDATE creative_assets 
SET status = 'rejected' 
WHERE id IN (
    SELECT id FROM creative_assets 
    WHERE status = 'pending' 
    ORDER BY random() 
    LIMIT 1
);
