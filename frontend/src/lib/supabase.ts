import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

console.log('[Debug] SUPABASE_URL set:', !!supabaseUrl, supabaseUrl?.slice(0, 30));
console.log('[Debug] SUPABASE_KEY set:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Realtime] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set — live updates disabled');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
