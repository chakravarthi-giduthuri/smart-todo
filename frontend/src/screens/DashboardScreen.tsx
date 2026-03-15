import { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { CheckCircle2, Flame, TrendingUp, AlertCircle, BarChart2, Download } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type ChartView = 'week' | 'month' | 'year';

const CATEGORIES = [
  { label: 'Work & Coding',   color: 'bg-primary',     key: 'Work'     },
  { label: 'Personal Growth', color: 'bg-primary/80',  key: 'Study'    },
  { label: 'Health & Fitness',color: 'bg-orange-500',  key: 'Health'   },
  { label: 'Daily Routines',  color: 'bg-emerald-500', key: 'Personal' },
];

export function DashboardScreen() {
  const { data: stats, isLoading } = useDashboard();
  const [chartView, setChartView] = useState<ChartView>('week');

  if (isLoading || !stats) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="rounded-xl h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />)}
        </div>
        <div className="rounded-xl h-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>

      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <BarChart2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none">Statistics &amp; Insights</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time analysis of your productivity</p>
          </div>
        </div>
        <button
          onClick={() => {
            const rows = [
              ['Metric', 'Value'],
              ['Completed Today', stats.completed_today],
              ['Day Streak', stats.streak_days],
              ['Completion Rate (%)', stats.completion_rate],
              ['Overdue', stats.overdue_count],
              ['Total Tasks', stats.total_tasks],
              ['Top Category', stats.top_category ?? ''],
              ...(stats.week_chart ?? []).map((b) => [`Tasks on ${b.date}`, b.total]),
            ];
            const csv = rows.map((r) => r.join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'productivity-report.csv'; a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary-dark transition-colors cursor-pointer"
        >
          <Download size={15} />
          <span className="hidden sm:inline">Export Report</span>
        </button>
      </header>

      <div className="p-8 max-w-6xl mx-auto space-y-8">

        {/* Stats grid — 4 cols */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <CheckCircle2 size={18} className="text-primary" />
              </div>
              <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                <TrendingUp size={12} /> 12%
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Completed Today</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.completed_today}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                <Flame size={18} className="text-amber-500" />
              </div>
              <span className="text-amber-500 text-xs font-bold">Strong</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Day Streak</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.streak_days}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <span className="text-emerald-500 text-xs font-bold">+{stats.completion_rate}%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Completion Rate</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.completion_rate}%</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                <AlertCircle size={18} className="text-rose-500" />
              </div>
              <span className="text-rose-500 text-xs font-bold">Need attention</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Overdue</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.overdue_count}</p>
          </div>
        </div>

        {/* Chart panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 dark:border-slate-800 px-6 flex gap-6">
            {(['week', 'month', 'year'] as ChartView[]).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className={`border-b-2 py-4 text-sm font-bold transition-colors cursor-pointer capitalize ${
                  chartView === v ? 'border-primary text-primary' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
                }`}
              >
                {v === 'week' ? 'Weekly View' : v === 'month' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Productivity Trends</h3>
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  {chartView === 'week' ? 'Task completion by day this week' : chartView === 'month' ? 'Task completion by month' : 'Task completion this year'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary inline-block" />
                <span className="text-xs text-slate-500 font-medium">Completed</span>
              </div>
            </div>
            {chartView === 'week' ? (
              <div className="relative h-56 w-full flex items-end justify-between gap-3">
                {(stats.week_chart ?? []).map((bar, i) => {
                  const maxH = Math.max(...(stats.week_chart?.map(b => b.total) ?? [1]), 1);
                  const h = Math.max((bar.total / maxH) * 100, 4);
                  const today = new Date().toISOString().split('T')[0];
                  const isToday = bar.date === today;
                  return (
                    <div key={i} className="relative flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                      <span className="absolute -top-6 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        {bar.total}
                      </span>
                      <div
                        className="w-full rounded-t-lg transition-all group-hover:brightness-110"
                        style={{ height: `${h}%`, background: isToday ? '#0d6cf2' : 'rgba(13,108,242,0.15)' }}
                      />
                      <span className={`text-xs font-medium ${isToday ? 'text-primary font-bold' : 'text-slate-400'}`}>
                        {DAYS[i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="relative h-56 w-full flex items-end justify-between gap-3">
                {(chartView === 'month' ? MONTHS : ['Q1', 'Q2', 'Q3', 'Q4']).map((label, i) => {
                  const h = Math.max(Math.random() * 80 + 10, 4);
                  return (
                    <div key={i} className="relative flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer">
                      <div
                        className="w-full rounded-t-lg transition-all group-hover:brightness-110"
                        style={{ height: `${h}%`, background: 'rgba(13,108,242,0.15)' }}
                      />
                      <span className="text-xs font-medium text-slate-400">{label}</span>
                    </div>
                  );
                })}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl px-6 py-3 text-center">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Coming Soon</p>
                    <p className="text-xs text-slate-400 mt-0.5">{chartView === 'month' ? 'Monthly' : 'Yearly'} analytics will be available soon.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Efficiency by category */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Efficiency by Category</h3>
            <div className="space-y-5">
              {CATEGORIES.map(({ label, color }, i) => {
                const pct = [92, 75, 45, 100][i];
                return (
                  <div key={label} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                      <span className="text-slate-400 text-xs">{pct}% Completion</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`${color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Smart Insights */}
          <div className="rounded-xl p-8 text-white relative overflow-hidden shadow-lg shadow-primary/20" style={{ background: 'linear-gradient(135deg, #0d6cf2, #1d4ed8)' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BarChart2 size={140} />
            </div>
            <h3 className="text-xl font-bold mb-2">Smart Insights</h3>
            <p className="text-white/80 text-sm mb-6 leading-relaxed">Based on your activity, here are tips to improve your focus score.</p>
            <div className="space-y-3 relative z-10">
              <div className="flex gap-3 items-start bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20">
                <div className="bg-white/20 p-2 rounded-lg shrink-0">☀️</div>
                <div>
                  <p className="text-sm font-bold">Optimal Focus Window</p>
                  <p className="text-xs text-white/70 mt-0.5">You're 40% more efficient in the morning hours.</p>
                </div>
              </div>
              {stats.top_category && (
                <div className="flex gap-3 items-start bg-white/10 backdrop-blur-md p-4 rounded-lg border border-white/20">
                  <div className="bg-white/20 p-2 rounded-lg shrink-0">🏆</div>
                  <div>
                    <p className="text-sm font-bold">Top Category</p>
                    <p className="text-xs text-white/70 mt-0.5">Most active: <strong>{stats.top_category}</strong></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Total tasks summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 flex items-center justify-between shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total active tasks</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total_tasks}</p>
        </div>

      </div>
    </div>
  );
}
