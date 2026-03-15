import { apiFetch } from './client';
import type { ShareToken } from '../types/api';
import type { Task } from '../types/task';

export async function createShare(taskId: string, recipientEmail?: string): Promise<ShareToken> {
  return apiFetch<ShareToken>('/api/shares', {
    method: 'POST',
    body: JSON.stringify({ task_id: taskId, recipient_email: recipientEmail }),
  });
}

export interface PublicShare {
  share: ShareToken;
  task: Pick<Task, 'id' | 'title' | 'category' | 'scheduled_date' | 'scheduled_time' | 'note'>;
}

export async function getShare(token: string): Promise<PublicShare> {
  return apiFetch<PublicShare>(`/api/shares/${token}`);
}

export async function completeShare(token: string): Promise<void> {
  await apiFetch<void>(`/api/shares/${token}/complete`, { method: 'PATCH' });
}
