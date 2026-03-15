import { apiFetch } from './client';
import type { DashboardStats } from '../types/api';

export async function getDashboard(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/api/dashboard');
}
