import { supabase, type UserSupabaseClient } from './supabase';
import type { Task, InsertTaskInput, TaskFilters } from '../types/task';

type Db = UserSupabaseClient | typeof supabase;

export async function insertTask(data: InsertTaskInput, db: Db = supabase): Promise<Task> {
  const { data: task, error } = await db
    .from('tasks')
    .insert({
      user_id: data.user_id,
      raw_input: data.raw_input,
      title: data.title,
      category: data.category,
      priority: data.priority,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      duration_minutes: data.duration_minutes,
      ai_reasoning: data.ai_reasoning,
      reminder_minutes_before: data.reminder_minutes_before,
      timezone_offset_minutes: data.timezone_offset_minutes,
      recurrence: data.recurrence ?? null,
      recurrence_parent_id: data.recurrence_parent_id ?? null,
      context_tags: data.context_tags ?? [],
      note: data.note ?? null,
      is_completed: false,
      reminder_sent: false,
      is_archived: false,
    })
    .select()
    .single();

  if (error) throw new Error(`insertTask failed: ${error.message}`);
  return task as Task;
}

export async function listTasks(filters: TaskFilters = {}, userId?: string, db: Db = supabase): Promise<Task[]> {
  let query = db.from('tasks').select('*').eq('is_archived', false).order('priority', { ascending: true }).order('created_at', { ascending: false });

  if (userId) query = query.eq('user_id', userId);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.is_completed !== undefined) query = query.eq('is_completed', filters.is_completed);

  const { data, error } = await query;
  if (error) throw new Error(`listTasks failed: ${error.message}`);
  return (data ?? []) as Task[];
}

export async function markComplete(id: string, db: Db = supabase): Promise<Task> {
  const { data, error } = await db
    .from('tasks')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`markComplete failed: ${error.message}`);
  return data as Task;
}

export async function updateTaskField(id: string, field: string, value: unknown, db: Db = supabase): Promise<Task> {
  const { data, error } = await db
    .from('tasks')
    .update({ [field]: value })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`updateTaskField failed: ${error.message}`);
  return data as Task;
}

export async function markReminderSent(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').update({ reminder_sent: true }).eq('id', id);
  if (error) throw new Error(`markReminderSent failed: ${error.message}`);
}

export async function getTasksByDateRange(from: string, to: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .gte('scheduled_date', from)
    .lte('scheduled_date', to)
    .order('scheduled_time', { ascending: true });

  if (error) throw new Error(`getTasksByDateRange failed: ${error.message}`);
  return (data ?? []) as Task[];
}

export async function archiveTask(id: string, db: Db = supabase): Promise<Task> {
  const { data, error } = await db
    .from('tasks')
    .update({ is_archived: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`archiveTask failed: ${error.message}`);
  return data as Task;
}

export async function deleteTask(id: string, db: Db = supabase): Promise<void> {
  const { error } = await db.from('tasks').delete().eq('id', id);
  if (error) throw new Error(`deleteTask failed: ${error.message}`);
}

function computeNextDate(task: Task): string | null {
  if (!task.recurrence || !task.scheduled_date) return null;
  const base = new Date(task.scheduled_date + 'T12:00:00Z');

  if (task.recurrence === 'daily') {
    base.setUTCDate(base.getUTCDate() + 1);
  } else if (task.recurrence === 'weekly') {
    base.setUTCDate(base.getUTCDate() + 7);
  } else if (task.recurrence === 'monthly') {
    base.setUTCMonth(base.getUTCMonth() + 1);
  } else if (task.recurrence === 'weekdays') {
    base.setUTCDate(base.getUTCDate() + 1);
    while (base.getUTCDay() === 0 || base.getUTCDay() === 6) {
      base.setUTCDate(base.getUTCDate() + 1);
    }
  } else {
    return null;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}`;
}

export async function spawnNextRecurrence(task: Task): Promise<void> {
  const nextDate = computeNextDate(task);
  if (!nextDate) return;

  await insertTask({
    user_id: task.user_id,
    raw_input: task.raw_input,
    title: task.title,
    category: task.category,
    priority: task.priority,
    scheduled_date: nextDate,
    scheduled_time: task.scheduled_time,
    duration_minutes: task.duration_minutes,
    ai_reasoning: task.ai_reasoning,
    reminder_minutes_before: task.reminder_minutes_before,
    timezone_offset_minutes: task.timezone_offset_minutes,
    recurrence: task.recurrence,
    recurrence_parent_id: task.recurrence_parent_id ?? task.id,
  });
}

export async function snoozeTask(id: string, snoozedUntilISO: string, db: Db = supabase): Promise<Task> {
  const { data, error } = await db
    .from('tasks')
    .update({ snoozed_until: snoozedUntilISO })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`snoozeTask failed: ${error.message}`);
  return data as Task;
}

export async function getDueTasks(): Promise<Task[]> {
  const nowUtc = new Date();
  const nowIso = nowUtc.toISOString();
  const pad = (n: number) => String(n).padStart(2, '0');

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_completed', false)
    .eq('reminder_sent', false)
    .not('scheduled_date', 'is', null)
    .not('scheduled_time', 'is', null)
    .or(`snoozed_until.is.null,snoozed_until.lt.${nowIso}`);

  if (error) throw new Error(`getDueTasks failed: ${error.message}`);
  const tasks = (data ?? []) as Task[];

  return tasks.filter((task) => {
    const offsetMs = (task.timezone_offset_minutes ?? 0) * 60_000;
    const userLocalNow = new Date(nowUtc.getTime() + offsetMs);

    const userLocalDate = `${userLocalNow.getUTCFullYear()}-${pad(userLocalNow.getUTCMonth() + 1)}-${pad(userLocalNow.getUTCDate())}`;
    if (task.scheduled_date !== userLocalDate) return false;

    const [hh, mm] = task.scheduled_time!.slice(0, 5).split(':').map(Number);
    const taskMinutes = hh * 60 + mm;
    const reminderMin = task.reminder_minutes_before ?? 15;
    const notifyMinutes = taskMinutes - reminderMin;
    const curMinutes = userLocalNow.getUTCHours() * 60 + userLocalNow.getUTCMinutes();

    return curMinutes >= notifyMinutes - 1 && curMinutes <= notifyMinutes + 5;
  });
}
