import { supabase } from './supabase';
import type { Task, InsertTaskInput, TaskFilters } from '../types/task';

export async function insertTask(data: InsertTaskInput): Promise<Task> {
  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      raw_input: data.raw_input,
      title: data.title,
      category: data.category,
      priority: data.priority,
      scheduled_date: data.scheduled_date,
      scheduled_time: data.scheduled_time,
      duration_minutes: data.duration_minutes,
      ai_reasoning: data.ai_reasoning,
      reminder_minutes_before: data.reminder_minutes_before,
      is_completed: false,
      reminder_sent: false,
    })
    .select()
    .single();

  if (error) throw new Error(`insertTask failed: ${error.message}`);
  return task as Task;
}

export async function listTasks(filters: TaskFilters = {}): Promise<Task[]> {
  let query = supabase.from('tasks').select('*').order('priority', { ascending: true }).order('created_at', { ascending: false });

  if (filters.category) query = query.eq('category', filters.category);
  if (filters.is_completed !== undefined) query = query.eq('is_completed', filters.is_completed);

  const { data, error } = await query;
  if (error) throw new Error(`listTasks failed: ${error.message}`);
  return (data ?? []) as Task[];
}

export async function markComplete(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`markComplete failed: ${error.message}`);
  return data as Task;
}

export async function updateTaskField(id: string, field: string, value: unknown): Promise<Task> {
  const { data, error } = await supabase
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

export async function getDueTasks(): Promise<Task[]> {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  // Fetch all unnotified, incomplete tasks for today that have a scheduled time.
  // We then filter in Node because each task has its own reminder_minutes_before.
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('is_completed', false)
    .eq('reminder_sent', false)
    .eq('scheduled_date', todayStr)
    .not('scheduled_time', 'is', null);

  if (error) throw new Error(`getDueTasks failed: ${error.message}`);
  const tasks = (data ?? []) as Task[];

  // Keep tasks whose notify_at (scheduled_time - reminder_minutes_before) falls
  // within the current cron window [now - 1 min, now + 5 min].
  const windowStart = now.getTime() - 60_000;       // 1 min ago (catch late cron)
  const windowEnd   = now.getTime() + 5 * 60_000;   // 5 min ahead (cron interval)

  return tasks.filter((task) => {
    const timePart = task.scheduled_time!.slice(0, 5);
    const [hh, mm] = timePart.split(':').map(Number);
    const scheduledMs = new Date(
      now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0
    ).getTime();

    const reminderMin = task.reminder_minutes_before ?? 15;
    const notifyAt = scheduledMs - reminderMin * 60_000;

    return notifyAt >= windowStart && notifyAt <= windowEnd;
  });
}
