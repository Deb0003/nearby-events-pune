import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// This client uses the public anon key — safe to ship to the browser.
// Row Level Security (see supabase/schema.sql) is what actually keeps
// writes/reads restricted, not this key.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
