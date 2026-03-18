import { apiFetch } from './client';
import type { FocusResponse } from '../types/api';

export async function getFocusTask(): Promise<FocusResponse> {
  return apiFetch<FocusResponse>('/api/focus');
}
