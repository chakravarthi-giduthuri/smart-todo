import { apiFetch } from './client';
import type { Task } from '../types/task';
import type { PatchOverrideRequest } from '../types/api';

export async function patchOverride(taskId: string, data: PatchOverrideRequest): Promise<Task> {
  const res = await apiFetch<{ task: Task }>(`/api/tasks/${taskId}/override`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.task;
}
