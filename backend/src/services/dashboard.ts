import { supabase } from '../db/supabase';
import type { Category } from '../types/task';

export interface DashboardStats {
  total_tasks: number;
  completed_today: number;
  completion_rate: number;
  top_category: Category | null;
  tasks_this_week: number;
  overdue_count: number;
  week_chart: Array<{ date: string; total: number; completed: number }>;
}

export async function aggregateStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

  const [totalResult, completedTodayResult, categoryResult, weekResult, overdueResult, chartResult] =
    await Promise.all([
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_completed', true).eq('scheduled_date', today),
      supabase.from('tasks').select('category'),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).gte('scheduled_date', weekStartStr),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_completed', false).lt('scheduled_date', today),
      supabase.from('tasks').select('scheduled_date, is_completed').gte('scheduled_date', sevenDaysAgoStr).lte('scheduled_date', today),
    ]);

  // Top category
  const cats = (categoryResult.data ?? []) as { category: string }[];
  const catCounts: Record<string, number> = {};
  for (const { category } of cats) catCounts[category] = (catCounts[category] ?? 0) + 1;
  const topCategory = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as Category | null ?? null;

  // 7-day chart
  const chartRows = (chartResult.data ?? []) as { scheduled_date: string; is_completed: boolean }[];
  const chartMap = new Map<string, { total: number; completed: number }>();

  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    chartMap.set(d.toISOString().split('T')[0], { total: 0, completed: 0 });
  }

  for (const row of chartRows) {
    const entry = chartMap.get(row.scheduled_date);
    if (entry) {
      entry.total++;
      if (row.is_completed) entry.completed++;
    }
  }

  const total = totalResult.count ?? 0;
  const completedToday = completedTodayResult.count ?? 0;
  const todayTotal = chartMap.get(today)?.total ?? 0;

  return {
    total_tasks: total,
    completed_today: completedToday,
    completion_rate: todayTotal > 0 ? Math.round((completedToday / todayTotal) * 100) : 0,
    top_category: topCategory,
    tasks_this_week: weekResult.count ?? 0,
    overdue_count: overdueResult.count ?? 0,
    week_chart: Array.from(chartMap.entries()).map(([date, v]) => ({ date, ...v })),
  };
}
