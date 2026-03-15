import { supabase } from './supabase';
import type { Subtask, InsertSubtaskInput } from '../types/task';

export async function insertSubtask(data: InsertSubtaskInput): Promise<Subtask> {
  const { data: subtask, error } = await supabase
    .from('subtasks')
    .insert({
      task_id: data.task_id,
      title: data.title,
      position: data.position ?? 0,
      is_completed: false,
    })
    .select()
    .single();

  if (error) throw new Error(`insertSubtask failed: ${error.message}`);
  return subtask as Subtask;
}

export async function listSubtasks(taskId: string): Promise<Subtask[]> {
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', taskId)
    .order('position', { ascending: true });

  if (error) throw new Error(`listSubtasks failed: ${error.message}`);
  return (data ?? []) as Subtask[];
}

export async function completeSubtask(id: string): Promise<Subtask> {
  const { data, error } = await supabase
    .from('subtasks')
    .update({ is_completed: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`completeSubtask failed: ${error.message}`);
  return data as Subtask;
}

export async function deleteSubtask(id: string): Promise<void> {
  const { error } = await supabase.from('subtasks').delete().eq('id', id);
  if (error) throw new Error(`deleteSubtask failed: ${error.message}`);
}
