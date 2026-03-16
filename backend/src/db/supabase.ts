import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
}

// Use service role key for backend DB operations (bypasses RLS).
// Falls back to anon key if service role key is not set.
const activeKey = supabaseServiceKey ?? supabaseAnonKey;
export const supabase = createClient(supabaseUrl, activeKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

if (!supabaseServiceKey) {
  console.warn('[Supabase] SUPABASE_SERVICE_ROLE_KEY not set — using anon key, RLS will apply');
} else {
  console.log('[Supabase] Using service role key — RLS bypassed');
}
