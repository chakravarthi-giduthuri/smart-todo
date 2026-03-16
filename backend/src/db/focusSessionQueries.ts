import type { UserSupabaseClient } from './supabase';
import { supabase } from './supabase';

type Db = UserSupabaseClient | typeof supabase;

export async function startFocusSession(
  data: { user_id: string; task_id: string; planned_minutes: number },
  db: Db = supabase
) {
  const { data: session, error } = await db
    .from('focus_sessions')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return session;
}

export async function endFocusSession(
  id: string,
  actual_minutes: number,
  completed: boolean,
  db: Db = supabase
) {
  const { data, error } = await db
    .from('focus_sessions')
    .update({ ended_at: new Date().toISOString(), actual_minutes, completed })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listFocusSessions(userId: string, limit = 20, db: Db = supabase) {
  const { data } = await db
    .from('focus_sessions')
    .select('*, tasks(title, category)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
