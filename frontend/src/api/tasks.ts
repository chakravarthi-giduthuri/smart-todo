import { apiFetch } from './client';
import type { Task } from '../types/task';
import type { CreateTaskRequest } from '../types/api';

export async function createTask(data: CreateTaskRequest): Promise<Task> {
  const res = await apiFetch<{ task: Task }>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.task;
}

export async function listTasks(params?: { category?: string; completed?: boolean }): Promise<Task[]> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set('category', params.category);
  if (params?.completed !== undefined) qs.set('completed', String(params.completed));
  const query = qs.toString() ? `?${qs}` : '';
  const res = await apiFetch<{ tasks: Task[] }>(`/api/tasks${query}`);
  return res.tasks;
}

export async function completeTask(id: string): Promise<Task> {
  const res = await apiFetch<{ task: Task }>(`/api/tasks/${id}/complete`, { method: 'PATCH' });
  return res.task;
}

export async function deleteTask(id: string): Promise<void> {
  await apiFetch<void>(`/api/tasks/${id}`, { method: 'DELETE' });
}
