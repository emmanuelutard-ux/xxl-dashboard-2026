import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Fonction helper pour créer une nouvelle instance à chaque requête (Server Actions friendly)
export const createClient = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
        throw new Error("Les variables d'environnement Supabase sont manquantes.");
    }

    return createSupabaseClient(url, key);
};
