import { supabase, type UserSupabaseClient } from './supabase';
import type { OverrideLog, InsertOverrideInput } from '../types/task';

type Db = UserSupabaseClient | typeof supabase;

export async function insertOverride(data: InsertOverrideInput, db: Db = supabase): Promise<OverrideLog> {
  const { data: log, error } = await db
    .from('override_log')
    .insert(data)
    .select()
    .single();

  if (error) throw new Error(`insertOverride failed: ${error.message}`);
  return log as OverrideLog;
}

export async function getRecentOverrides(limit = 20, userId?: string): Promise<OverrideLog[]> {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  let query = supabase
    .from('override_log')
    .select('*')
    .gte('created_at', sixtyDaysAgo.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw new Error(`getRecentOverrides failed: ${error.message}`);
  return (data ?? []) as OverrideLog[];
}

export async function getAllOverrides(userId?: string): Promise<OverrideLog[]> {
  let query = supabase
    .from('override_log')
    .select('*')
    .order('created_at', { ascending: true });

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw new Error(`getAllOverrides failed: ${error.message}`);
  return (data ?? []) as OverrideLog[];
}

/** Returns overrides joined with the task title for display in the journal. */
export async function getOverridesWithTitles(limit = 15, userId?: string): Promise<Array<OverrideLog & { task_title: string | null }>> {
  let query = supabase
    .from('override_log')
    .select('*, tasks(title)')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;
  if (error) throw new Error(`getOverridesWithTitles failed: ${error.message}`);
  return (data ?? []).map((row) => {
    const r = row as unknown as Record<string, unknown>;
    const log = r as unknown as OverrideLog;
    const task_title = (r.tasks as { title: string } | null)?.title ?? null;
    return { ...log, task_title };
  });
}

export async function getOverrideCount(userId?: string): Promise<number> {
  let query = supabase
    .from('override_log')
    .select('*', { count: 'exact', head: true });

  if (userId) query = query.eq('user_id', userId);

  const { count, error } = await query;
  if (error) throw new Error(`getOverrideCount failed: ${error.message}`);
  return count ?? 0;
}

export async function truncateOverrideLogs(userId: string): Promise<void> {
  const { error } = await supabase.from('override_log').delete().eq('user_id', userId);
  if (error) throw new Error(`truncateOverrideLogs failed: ${error.message}`);
}
