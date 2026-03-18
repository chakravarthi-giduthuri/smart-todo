import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboard } from '../api/dashboard';
import { apiFetch } from '../api/client';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: 60_000,
  });
}

export interface DailyPlan {
  id?: string;
  plan_date: string;
  task_ids: string[];
  plan_order: string[];
  goal: string | null;
}

export function useDailyPlan(date: string) {
  return useQuery<DailyPlan>({
    queryKey: ['daily-plan', date],
    queryFn: () => apiFetch<DailyPlan>(`/api/daily-plan?date=${date}`),
    staleTime: 30_000,
  });
}

export function useUpsertDailyPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { plan_date: string; task_ids: string[]; plan_order: string[]; goal?: string }) =>
      apiFetch('/api/daily-plan', { method: 'PUT', body: JSON.stringify(body) }),
    onSuccess: (_: unknown, vars: { plan_date: string; task_ids: string[]; plan_order: string[]; goal?: string }) =>
      qc.invalidateQueries({ queryKey: ['daily-plan', vars.plan_date] }),
  });
}

export interface WeeklyReview {
  id: string;
  week_start: string;
  score: number | null;
  summary: string | null;
  wins: string[] | null;
  improvement_areas: string[] | null;
  next_week_suggestions: string[] | null;
  created_at: string;
}

export function useWeeklyReviews() {
  return useQuery({
    queryKey: ['weekly-reviews'],
    queryFn: () => apiFetch<{ reviews: WeeklyReview[] }>('/api/dashboard/weekly-reviews?limit=4').then(r => r.reviews),
    staleTime: 5 * 60_000,
  });
}
