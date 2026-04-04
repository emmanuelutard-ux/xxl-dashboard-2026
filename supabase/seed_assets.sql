-- SEED ASSETS
-- Usage: Execute this in Supabase SQL Editor to populate creative assets for programs.

DO $$
DECLARE
    jardins_id uuid;
    cedres_id uuid;
    horizon_id uuid;
BEGIN
    -- 1. Get Program IDs
    SELECT id INTO jardins_id FROM real_estate_programs WHERE name = 'Résidence Les Jardins de la Gare' LIMIT 1;
    SELECT id INTO cedres_id FROM real_estate_programs WHERE name = 'Résidence Les Cèdres' LIMIT 1;
    SELECT id INTO horizon_id FROM real_estate_programs WHERE name = 'Tour Horizon' LIMIT 1;

    -- 2. Clear existing assets for these programs to avoid duplicates on re-run
    IF jardins_id IS NOT NULL THEN DELETE FROM creative_assets WHERE program_id = jardins_id; END IF;
    IF cedres_id IS NOT NULL THEN DELETE FROM creative_assets WHERE program_id = cedres_id; END IF;
    IF horizon_id IS NOT NULL THEN DELETE FROM creative_assets WHERE program_id = horizon_id; END IF;

    -- 3. Insert Assets

    -- JARDINS DE LA GARE
    IF jardins_id IS NOT NULL THEN
        INSERT INTO creative_assets (program_id, type, url, status) VALUES
        (jardins_id, 'image', 'https://images.unsplash.com/photo-1600596542815-6ad4c727dd2c?auto=format&fit=crop&w=1080&q=80', 'validated'), -- Modern House
        (jardins_id, 'image', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1080&h=1920&q=80', 'validated'), -- Vert (Story)
        (jardins_id, 'video', 'https://videos.pexels.com/video-files/3773487/3773487-uhd_2560_1440_25fps.mp4', 'proposed'); -- Walking tour dummy
    END IF;

    -- CEDRES
    IF cedres_id IS NOT NULL THEN
        INSERT INTO creative_assets (program_id, type, url, status) VALUES
        (cedres_id, 'image', 'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1080&q=80', 'submitted'), -- Forest House
        (cedres_id, 'image', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1080&h=1920&q=80', 'submitted'), -- Garden (Story)
        (cedres_id, 'video', 'https://videos.pexels.com/video-files/7578552/7578552-uhd_3840_2160_30fps.mp4', 'validated'); -- Nature drone
    END IF;

    -- TOUR HORIZON
    IF horizon_id IS NOT NULL THEN
        INSERT INTO creative_assets (program_id, type, url, status) VALUES
        (horizon_id, 'image', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1080&q=80', 'validated'), -- Skyscraper
        (horizon_id, 'image', 'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?auto=format&fit=crop&w=1080&h=1920&q=80', 'proposed'), -- City View (Story)
        (horizon_id, 'video', 'https://videos.pexels.com/video-files/3121459/3121459-uhd_2560_1440_24fps.mp4', 'validated'); -- City Lapse
    END IF;

END $$;
