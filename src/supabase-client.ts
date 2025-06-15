import { createClient } from "@supabase/supabase-js";

const supabaseURL = "https://xnskynghatlhxplxcmal.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient(supabaseURL, supabaseAnonKey);
