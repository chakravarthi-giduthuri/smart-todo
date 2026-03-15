import { supabase } from './supabase';
import type { TaskDependency } from '../types/task';

export async function addDependency(taskId: string, dependsOnId: string): Promise<TaskDependency> {
  if (taskId === dependsOnId) {
    throw new Error('A task cannot depend on itself');
  }

  const { data, error } = await supabase
    .from('task_dependencies')
    .insert({ task_id: taskId, depends_on_id: dependsOnId })
    .select()
    .single();

  if (error) throw new Error(`addDependency failed: ${error.message}`);
  return data as TaskDependency;
}

export async function listDependencies(taskId: string): Promise<TaskDependency[]> {
  const { data, error } = await supabase
    .from('task_dependencies')
    .select('*')
    .eq('task_id', taskId);

  if (error) throw new Error(`listDependencies failed: ${error.message}`);
  return (data ?? []) as TaskDependency[];
}

export async function removeDependency(taskId: string, depId: string): Promise<void> {
  const { error } = await supabase
    .from('task_dependencies')
    .delete()
    .eq('task_id', taskId)
    .eq('id', depId);

  if (error) throw new Error(`removeDependency failed: ${error.message}`);
}
