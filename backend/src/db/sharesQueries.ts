import { supabase } from './supabase';
import type { TaskShare } from '../types/task';
import { randomBytes } from 'crypto';

export async function createShare(taskId: string, recipientEmail?: string): Promise<TaskShare> {
  const token = randomBytes(16).toString('hex');

  const { data, error } = await supabase
    .from('task_shares')
    .insert({
      task_id: taskId,
      token,
      recipient_email: recipientEmail ?? null,
      is_completed: false,
    })
    .select()
    .single();

  if (error) throw new Error(`createShare failed: ${error.message}`);
  return data as TaskShare;
}

export async function getShare(token: string): Promise<{ share: TaskShare; task: Record<string, unknown> } | null> {
  const { data, error } = await supabase
    .from('task_shares')
    .select('*, tasks(id, title, category, scheduled_date, scheduled_time, note)')
    .eq('token', token)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error(`getShare failed: ${error.message}`);
  }
  if (!data) return null;
  const { tasks, ...share } = data as any;
  return { share: share as TaskShare, task: tasks as Record<string, unknown> };
}

export async function completeShare(token: string): Promise<TaskShare> {
  const { data, error } = await supabase
    .from('task_shares')
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq('token', token)
    .select()
    .single();

  if (error) throw new Error(`completeShare failed: ${error.message}`);
  return data as TaskShare;
}
