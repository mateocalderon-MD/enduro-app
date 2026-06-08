// src/lib/supabase.ts
// Cliente único de Supabase para toda la app.
// Lee la config desde .env.local (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local',
  );
}

export const supabase = createClient(url, anonKey);
