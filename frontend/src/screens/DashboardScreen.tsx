import { PageShell } from '../components/layout/PageShell';
import { WeekBarChart } from '../components/dashboard/WeekBarChart';
import { useDashboard } from '../hooks/useDashboard';
import { CheckCircle2, Flame, TrendingUp, AlertCircle, BarChart2 } from 'lucide-react';

export function DashboardScreen() {
  const { data: stats, isLoading } = useDashboard();

  if (isLoading || !stats) {
    return (
      <PageShell className="p-4 pt-6">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-100 dark:bg-white/5 rounded-xl w-40" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="rounded-xl h-28 bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08]" />)}
          </div>
          <div className="rounded-xl h-40 bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08]" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="p-4 pt-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 bg-gradient-accent">
          <BarChart2 size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-gray-900 dark:text-white leading-none">Statistics</h1>
          <p className="text-xs text-gray-500 dark:text-white/30 mt-0.5">Your productivity insights</p>
        </div>
      </div>

      {/* Primary metric cards - 2x2 grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Tasks Completed */}
        <div className="rounded-2xl p-4 animate-slide-up-fade bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08]">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 bg-blue-50 dark:bg-blue-500/15">
            <CheckCircle2 size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white animate-count-up">{stats.completed_today}</p>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">Done Today</p>
          <p className="text-[10px] text-blue-500/70 mt-1 font-semibold">{stats.completion_rate}% rate</p>
        </div>

        {/* Day Streak */}
        <div className="rounded-2xl p-4 animate-slide-up-fade bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08]" style={{ animationDelay: '50ms' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 bg-amber-50 dark:bg-amber-500/15">
            <Flame size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white animate-count-up">{stats.streak_days}</p>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">Day Streak</p>
          <p className="text-[10px] text-amber-500/70 mt-1 font-semibold">Keep it up!</p>
        </div>

        {/* This Week */}
        <div className="rounded-2xl p-4 animate-slide-up-fade bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08]" style={{ animationDelay: '100ms' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 bg-emerald-50 dark:bg-emerald-500/15">
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white animate-count-up">{stats.tasks_this_week}</p>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">This Week</p>
          <p className="text-[10px] text-emerald-500/70 mt-1 font-semibold">Total tasks</p>
        </div>

        {/* Overdue */}
        <div className="rounded-2xl p-4 animate-slide-up-fade bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08]" style={{ animationDelay: '150ms' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3 bg-rose-50 dark:bg-rose-500/15">
            <AlertCircle size={16} className="text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white animate-count-up">{stats.overdue_count}</p>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">Overdue</p>
          <p className="text-[10px] text-rose-500/70 mt-1 font-semibold">Need attention</p>
        </div>
      </div>

      {/* Top Category highlight */}
      {stats.top_category && (
        <div className="rounded-xl px-4 py-3 mb-3 flex items-center justify-between animate-scale-in bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08]" style={{ animationDelay: '200ms' }}>
          <div>
            <p className="text-xs text-gray-500 dark:text-white/40">Most active category</p>
            <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{stats.top_category}</p>
          </div>
          <div className="text-2xl">🏆</div>
        </div>
      )}

      {/* Total tasks */}
      <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between animate-scale-in bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08]" style={{ animationDelay: '250ms' }}>
        <p className="text-xs text-gray-500 dark:text-white/40">Total active tasks</p>
        <p className="text-xl font-extrabold text-gray-900 dark:text-white">{stats.total_tasks}</p>
      </div>

      {/* 7-day chart */}
      <WeekBarChart data={stats.week_chart} />
    </PageShell>
  );
}
