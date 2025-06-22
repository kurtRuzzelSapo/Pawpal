import { createClient } from "@supabase/supabase-js";

const supabaseURL = "https://xnskynghatlhxplxcmal.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Debug logging
console.log("Supabase URL:", supabaseURL);
console.log("Anon Key exists:", !!supabaseAnonKey);
console.log("Service Key exists:", !!supabaseServiceKey);

if (!supabaseAnonKey) {
  throw new Error("Missing VITE_SUPABASE_ANON_KEY environment variable");
}

if (!supabaseServiceKey) {
  throw new Error("Missing VITE_SUPABASE_SERVICE_KEY environment variable");
}

export const supabase = createClient(supabaseURL, supabaseAnonKey);
export const supabaseAdmin = createClient(supabaseURL, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
