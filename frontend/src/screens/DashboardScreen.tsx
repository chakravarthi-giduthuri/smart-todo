import { PageShell } from '../components/layout/PageShell';
import { StatCard } from '../components/dashboard/StatCard';
import { WeekBarChart } from '../components/dashboard/WeekBarChart';
import { useDashboard } from '../hooks/useDashboard';
import { CheckCircle2, ListTodo, TrendingUp, CalendarDays, Tag, AlertCircle, Flame } from 'lucide-react';

export function DashboardScreen() {
  const { data: stats, isLoading } = useDashboard();

  if (isLoading || !stats) {
    return (
      <PageShell className="p-4 pt-6">
        <div className="grid grid-cols-2 gap-3 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl h-24" />)}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell className="p-4 pt-6">
      <h1 className="text-2xl font-extrabold text-white mb-1">Dashboard</h1>
      <p className="text-sm text-white/30 mb-5">Your productivity at a glance</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="Total Tasks"      value={stats.total_tasks}       icon={<ListTodo size={18} />}    accent="text-indigo-400" />
        <StatCard label="Done Today"       value={stats.completed_today}   icon={<CheckCircle2 size={18} />} accent="text-emerald-400" />
        <StatCard label="Completion Rate"  value={`${stats.completion_rate}%`} icon={<TrendingUp size={18} />} accent="text-violet-400" />
        <StatCard label="This Week"        value={stats.tasks_this_week}   icon={<CalendarDays size={18} />} accent="text-sky-400" />
        <StatCard label="Top Category"     value={stats.top_category ?? '–'} icon={<Tag size={18} />}       accent="text-amber-400" />
        <StatCard label="Overdue"          value={stats.overdue_count}     icon={<AlertCircle size={18} />}  accent="text-rose-400" />
        <StatCard label="Day Streak"       value={`${stats.streak_days}🔥`}  icon={<Flame size={18} />}      accent="text-orange-400" />
      </div>

      <WeekBarChart data={stats.week_chart} />
    </PageShell>
  );
}
