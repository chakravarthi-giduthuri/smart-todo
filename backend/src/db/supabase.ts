import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
}

// Admin client — used only for auth.getUser() token validation
export const supabase = createClient(supabaseUrl, supabaseServiceKey ?? supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * Creates a per-request Supabase client authenticated as the calling user.
 * This makes auth.uid() work in RLS policies, bypassing service-role issues.
 */
export function createUserClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export type UserSupabaseClient = ReturnType<typeof createUserClient>;
