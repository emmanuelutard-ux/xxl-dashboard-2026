-- Active RLS sur la table
ALTER TABLE real_estate_programs ENABLE ROW LEVEL SECURITY;

-- Créer une police pour permettre l'insertion aux utilisateurs authentifiés
CREATE POLICY "Enable insert for authenticated users only" ON real_estate_programs
FOR INSERT TO authenticated WITH CHECK (true);

-- Créer une police pour permettre la modification aux utilisateurs authentifiés
CREATE POLICY "Enable update for authenticated users only" ON real_estate_programs
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Créer une police pour permettre la lecture (nécessaire pour voir le résultat)
CREATE POLICY "Enable read access for all users" ON real_estate_programs
FOR SELECT TO authenticated USING (true);

-- Ajouter les valeurs par défaut pour sécuriser les insertions
ALTER TABLE real_estate_programs
ALTER COLUMN status SET DEFAULT 'active',
ALTER COLUMN conversion_source SET DEFAULT 'platform';
