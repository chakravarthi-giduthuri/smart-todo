import type { UserSupabaseClient } from './supabase';
import { supabase } from './supabase';

type Db = UserSupabaseClient | typeof supabase;

export async function getDailyPlan(date: string, userId: string, db: Db = supabase) {
  const { data } = await db
    .from('daily_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('plan_date', date)
    .maybeSingle();
  return data;
}

export async function upsertDailyPlan(
  plan: {
    user_id: string;
    plan_date: string;
    task_ids: string[];
    plan_order: string[];
    goal?: string;
  },
  db: Db = supabase
) {
  const { data, error } = await db
    .from('daily_plans')
    .upsert(plan, { onConflict: 'user_id,plan_date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
