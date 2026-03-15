import { supabase } from '../db/supabase';
import type { Category } from '../types/task';

export interface DashboardStats {
  total_tasks: number;
  completed_today: number;
  completion_rate: number;
  top_category: Category | null;
  tasks_this_week: number;
  overdue_count: number;
  streak_days: number;
  week_chart: Array<{ date: string; total: number; completed: number }>;
}

function localDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function aggregateStats(userId?: string): Promise<DashboardStats> {
  const now = new Date();
  const today = localDateStr(now);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = localDateStr(weekStart);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = localDateStr(sevenDaysAgo);

  // For streak: look back up to 90 days
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = localDateStr(ninetyDaysAgo);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const u = (q: any) => (userId ? q.eq('user_id', userId) : q);

  const [totalResult, completedTodayResult, categoryResult, weekResult, overdueResult, chartResult, streakResult] =
    await Promise.all([
      u(supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_archived', false)),
      u(supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_completed', true).eq('scheduled_date', today)),
      u(supabase.from('tasks').select('category').eq('is_archived', false)),
      u(supabase.from('tasks').select('*', { count: 'exact', head: true }).gte('scheduled_date', weekStartStr).eq('is_archived', false)),
      u(supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('is_completed', false).eq('is_archived', false).lt('scheduled_date', today)),
      u(supabase.from('tasks').select('scheduled_date, is_completed').gte('scheduled_date', sevenDaysAgoStr).lte('scheduled_date', today)),
      u(supabase.from('tasks').select('completed_at').eq('is_completed', true).gte('completed_at', ninetyDaysAgoStr + 'T00:00:00Z')),
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

  // Streak: count consecutive days (going backwards) with at least 1 completion
  const completedDates = new Set(
    ((streakResult.data ?? []) as { completed_at: string }[])
      .map(r => r.completed_at?.split('T')[0])
      .filter(Boolean)
  );
  let streak = 0;
  const check = new Date(now);
  // Start from today or yesterday depending on whether today has completions
  if (!completedDates.has(today)) check.setDate(check.getDate() - 1);
  for (let i = 0; i < 90; i++) {
    if (completedDates.has(localDateStr(check))) {
      streak++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
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
    streak_days: streak,
    week_chart: Array.from(chartMap.entries()).map(([date, v]) => ({ date, ...v })),
  };
}
