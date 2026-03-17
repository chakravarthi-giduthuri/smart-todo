import { apiFetch } from './client';
import type { Task, Subtask } from '../types/task';
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

export async function archiveTask(id: string): Promise<Task> {
  const res = await apiFetch<{ task: Task }>(`/api/tasks/${id}/archive`, { method: 'PATCH' });
  return res.task;
}

export async function getSubtasks(taskId: string): Promise<Subtask[]> {
  const res = await apiFetch<{ subtasks: Subtask[] }>(`/api/tasks/${taskId}/subtasks`);
  return res.subtasks;
}

export async function addSubtask(taskId: string, title: string): Promise<Subtask> {
  const res = await apiFetch<{ subtask: Subtask }>(`/api/tasks/${taskId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
  return res.subtask;
}

export async function completeSubtask(taskId: string, subtaskId: string): Promise<Subtask> {
  const res = await apiFetch<{ subtask: Subtask }>(`/api/tasks/${taskId}/subtasks/${subtaskId}/complete`, { method: 'PATCH' });
  return res.subtask;
}

export async function deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
  await apiFetch<void>(`/api/tasks/${taskId}/subtasks/${subtaskId}`, { method: 'DELETE' });
}

export async function snoozeTask(id: string, minutes: number): Promise<Task> {
  const res = await apiFetch<{ task: Task }>(`/api/tasks/${id}/snooze`, {
    method: 'PATCH',
    body: JSON.stringify({ minutes }),
  });
  return res.task;
}

export interface RescheduleResult {
  task: Task;
  reason: string | null;
  deadline_warning?: string;
}

export async function rescheduleTask(id: string, currentDate?: string): Promise<RescheduleResult> {
  const res = await apiFetch<RescheduleResult>(`/api/tasks/${id}/reschedule`, {
    method: 'PATCH',
    body: JSON.stringify({ current_date: currentDate ?? new Date().toISOString() }),
  });
  return res;
}

export async function updateTaskNote(id: string, note: string): Promise<Task> {
  const res = await apiFetch<{ task: Task }>(`/api/tasks/${id}/note`, {
    method: 'PATCH',
    body: JSON.stringify({ note }),
  });
  return res.task;
}

export interface DependencyItem { id: string; depends_on_id: string; depends_on_title?: string; }

export async function getDependencies(taskId: string): Promise<DependencyItem[]> {
  const res = await apiFetch<{ dependencies: DependencyItem[] }>(`/api/tasks/${taskId}/dependencies`);
  return res.dependencies;
}

export async function addDependency(taskId: string, dependsOnId: string): Promise<DependencyItem> {
  const res = await apiFetch<{ dependency: DependencyItem }>(`/api/tasks/${taskId}/dependencies`, {
    method: 'POST',
    body: JSON.stringify({ depends_on_id: dependsOnId }),
  });
  return res.dependency;
}

export async function removeDependency(taskId: string, depId: string): Promise<void> {
  await apiFetch<void>(`/api/tasks/${taskId}/dependencies/${depId}`, { method: 'DELETE' });
}

export async function setTaskNag(id: string, interval_minutes: number | null): Promise<Task> {
  const res = await apiFetch<{ task: Task }>(`/api/tasks/${id}/nag`, {
    method: 'PATCH',
    body: JSON.stringify({ interval_minutes }),
  });
  return res.task;
}

export async function scheduleTask(id: string, scheduled_date: string, scheduled_time: string): Promise<Task> {
  const res = await apiFetch<{ task: Task }>(`/api/tasks/${id}/schedule`, {
    method: 'PATCH',
    body: JSON.stringify({ scheduled_date, scheduled_time }),
  });
  return res.task;
}
