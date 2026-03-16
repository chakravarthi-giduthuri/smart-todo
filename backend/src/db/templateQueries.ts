import type { UserSupabaseClient } from './supabase';
import { supabase } from './supabase';

type Db = UserSupabaseClient | typeof supabase;

export async function listTemplates(userId: string, db: Db = supabase) {
  const { data } = await db
    .from('task_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data ?? [];
}

export async function createTemplate(data: Record<string, unknown>, db: Db = supabase) {
  const { data: tmpl, error } = await db
    .from('task_templates')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return tmpl;
}

export async function updateTemplate(id: string, updates: Record<string, unknown>, db: Db = supabase) {
  const { data, error } = await db
    .from('task_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTemplate(id: string, db: Db = supabase) {
  await db.from('task_templates').delete().eq('id', id);
}

export async function getActiveTemplatesForSpawning() {
  const today = new Date().toISOString().split('T')[0];
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon...
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  const { data } = await supabase
    .from('task_templates')
    .select('*')
    .eq('is_active', true)
    .or(
      `recurrence.eq.daily,recurrence.eq.${isWeekday ? 'weekdays' : 'never'},recurrence.eq.weekly,recurrence.eq.monthly`
    )
    .or(`last_spawned_date.is.null,last_spawned_date.lt.${today}`);
  return data ?? [];
}
