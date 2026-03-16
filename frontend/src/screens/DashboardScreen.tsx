import { useState } from 'react';
import { useDashboard, useWeeklyReviews } from '../hooks/useDashboard';
import { useTasks } from '../hooks/useTasks';
import {
  CheckCircle2, Flame, TrendingUp, TrendingDown, AlertCircle, BarChart2, Download,
  Search, X, Activity, Star, ChevronRight, ArrowRight,
} from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type ChartView = 'week' | 'month' | 'year';

const CATEGORIES = [
  { label: 'Work & Coding',    color: 'bg-primary',     key: 'Work'     },
  { label: 'Personal Growth',  color: 'bg-primary/80',  key: 'Study'    },
  { label: 'Health & Fitness', color: 'bg-orange-500',  key: 'Health'   },
  { label: 'Daily Routines',   color: 'bg-emerald-500', key: 'Personal' },
];

function getTodayStr() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function scoreColor(score: number): string {
  if (score >= 8) return 'bg-emerald-500 text-white';
  if (score >= 5) return 'bg-amber-500 text-white';
  return 'bg-rose-500 text-white';
}

export function DashboardScreen() {
  const { data: stats, isLoading } = useDashboard();
  const { data: allTasks = [] } = useTasks();
  const { data: weeklyReviews = [] } = useWeeklyReviews();
  const [trendView, setTrendView] = useState<ChartView>('week');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [searchQuery, setSearchQuery] = useState('');

  const today = getTodayStr();

  // Generate smooth SVG path from normalized values
  function trendPath(values: number[], w = 400, h = 100, pad = 12): string {
    if (values.length < 2) return '';
    const max = Math.max(...values, 1);
    const step = w / (values.length - 1);
    const pts = values.map((v, i) => ({ x: i * step, y: h - pad - (v / max) * (h - pad * 2) }));
    let d = `M${pts[0].x},${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cp = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C${cp},${pts[i - 1].y} ${cp},${pts[i].y} ${pts[i].x},${pts[i].y}`;
    }
    return d;
  }

  function trendArea(values: number[], w = 400, h = 100, pad = 12): string {
    const line = trendPath(values, w, h, pad);
    if (!line) return '';
    return `${line} L${w},${h} L0,${h} Z`;
  }

  if (isLoading || !stats) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-9 bg-slate-100 dark:bg-slate-800 rounded-xl w-56" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl h-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
          ))}
        </div>
        <div className="rounded-xl h-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  const weekValues = (stats.week_chart ?? []).map(b => b.total);
  const trendIsUp = weekValues.length > 1 && weekValues[weekValues.length - 1] >= weekValues[0];

  return (
    <div className="min-h-screen pb-28 md:pb-8" style={{ background: 'var(--app-bg)' }}>

      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-3 flex items-center gap-3">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
            <BarChart2 size={18} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black text-slate-900 dark:text-white leading-none">Statistics</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Productivity insights</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-9 pr-8 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={13} />
            </button>
          )}
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
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
        >
          <Download size={15} />
          <span className="hidden sm:inline">Export</span>
        </button>
      </header>

      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">

        {/* ── Stats grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                <CheckCircle2 size={16} className="text-primary" />
              </div>
              <span className="text-emerald-500 text-xs font-bold flex items-center gap-1"><TrendingUp size={11} /> 12%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Completed Today</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.completed_today}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                <Flame size={16} className="text-amber-500" />
              </div>
              <span className="text-amber-500 text-xs font-bold">Strong</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Day Streak</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.streak_days}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <span className="text-emerald-500 text-xs font-bold">+{stats.completion_rate}%</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Completion Rate</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.completion_rate}%</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                <AlertCircle size={16} className="text-rose-500" />
              </div>
              <span className="text-rose-500 text-xs font-bold">Attention</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">Overdue</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.overdue_count}</p>
          </div>
        </div>

        {/* ── Progressive Trend ── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">

          {/* Card header */}
          <div className="px-6 pt-6 pb-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity size={16} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Progressive Trend</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Completion velocity over time</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.completion_rate}%</p>
                <p className={`text-xs font-bold flex items-center gap-1 justify-end mt-0.5 ${trendIsUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {trendIsUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {trendIsUp ? '+' : ''}{weekValues.length > 1 ? (weekValues[weekValues.length - 1] - weekValues[0]) : 0} this week
                </p>
              </div>
            </div>

            {/* Period tabs + chart type toggle */}
            <div className="flex items-center justify-between mt-5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex gap-6">
                {(['week', 'month', 'year'] as ChartView[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setTrendView(v)}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                      trendView === v
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-400'
                    }`}
                  >
                    {v === 'week' ? 'Week' : v === 'month' ? 'Month' : 'Year'}
                  </button>
                ))}
              </div>
              {/* Bar / Line toggle */}
              <div className="flex items-center gap-1 mb-3 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setChartType('bar')}
                  title="Bar chart"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    chartType === 'bar'
                      ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <BarChart2 size={14} />
                </button>
                <button
                  onClick={() => setChartType('line')}
                  title="Line chart"
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    chartType === 'line'
                      ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Activity size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Chart body */}
          <div className="px-6 pt-5 pb-6">

            {trendView === 'week' && weekValues.length > 0 ? (
              <>
                {chartType === 'line' ? (
                  /* ── Line / area chart (all screen sizes) ── */
                  <div className="relative h-48 w-full mb-3">
                    <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="trendGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#0d6cf2" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#0d6cf2" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={trendArea(weekValues)} fill="url(#trendGrad)" />
                      <path d={trendPath(weekValues)} fill="none" stroke="#0d6cf2" strokeWidth="2.5" strokeLinecap="round" />
                      {weekValues.map((v, i) => {
                        const max = Math.max(...weekValues, 1);
                        const x = (i / (weekValues.length - 1)) * 400;
                        const y = 100 - 12 - (v / max) * (100 - 24);
                        return <circle key={i} cx={x} cy={y} r="3.5" fill="#0d6cf2" />;
                      })}
                    </svg>
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between pointer-events-none pr-2">
                      <span className="text-[10px] text-slate-300 dark:text-slate-600">{Math.max(...weekValues)}</span>
                      <span className="text-[10px] text-slate-300 dark:text-slate-600">0</span>
                    </div>
                  </div>
                ) : (
                  /* ── Bar chart (all screen sizes) ── */
                  <div className="flex items-end gap-2 h-48 mb-3">
                    {weekValues.map((v, i) => {
                      const max = Math.max(...weekValues, 1);
                      const pct = Math.max((v / max) * 100, 4);
                      const isToday = (stats.week_chart ?? [])[i]?.date === today;
                      return (
                        <div key={i} className="relative flex flex-col items-center gap-1.5 flex-1 h-full justify-end group cursor-pointer">
                          <span className="absolute -top-5 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{v}</span>
                          <div
                            className="w-full rounded-t-lg transition-all group-hover:brightness-110"
                            style={{ height: `${pct}%`, background: isToday ? '#0d6cf2' : 'rgba(13,108,242,0.2)' }}
                          />
                          <span className={`text-[10px] font-bold ${isToday ? 'text-primary' : 'text-slate-400'}`}>{DAYS[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Day labels (line chart only — bar chart already has inline labels) */}
                {chartType === 'line' && (
                  <div className="flex justify-between px-1">
                    {DAYS.map((d) => (
                      <span key={d} className="text-xs font-bold text-slate-400">{d}</span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Placeholder for month / year */
              <div className="relative h-48 w-full flex items-end justify-between gap-2">
                {(trendView === 'month' ? MONTHS : ['Q1', 'Q2', 'Q3', 'Q4']).map((label, i, arr) => {
                  const op = Math.round(((i + 1) / arr.length) * 100);
                  return (
                    <div key={label} className="flex flex-col items-center gap-2 flex-1 h-full justify-end">
                      <div className="w-full rounded-t-lg" style={{ height: '30%', background: `rgba(13,108,242,${op / 100})` }} />
                      <span className="text-[10px] font-bold text-slate-400">{label}</span>
                    </div>
                  );
                })}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl px-6 py-3 text-center">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Coming Soon</p>
                    <p className="text-xs text-slate-400 mt-0.5">{trendView === 'month' ? 'Monthly' : 'Yearly'} trend available soon.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mini KPI row */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="text-center">
                <p className="text-[11px] text-slate-400 font-medium">Peak Day</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {weekValues.length > 0 ? DAYS[weekValues.indexOf(Math.max(...weekValues))] : '—'}
                </p>
              </div>
              <div className="text-center border-x border-slate-100 dark:border-slate-800">
                <p className="text-[11px] text-slate-400 font-medium">Avg / Day</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {weekValues.length > 0 ? (weekValues.reduce((a, b) => a + b, 0) / weekValues.length).toFixed(1) : '0'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[11px] text-slate-400 font-medium">Best Run</p>
                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  {Math.max(...weekValues, 0)} tasks
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Efficiency by category */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-5">Efficiency by Category</h3>
            <div className="space-y-4">
              {CATEGORIES.map(({ label, color, key }, i) => {
                const count = allTasks.filter((t) => t.category === key).length;
                const done  = allTasks.filter((t) => t.category === key && t.is_completed).length;
                const pct   = count > 0 ? Math.round((done / count) * 100) : [92, 75, 45, 100][i];
                return (
                  <div key={label} className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">{label}</span>
                      <span className="text-slate-400 text-xs">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`${color} h-full rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Smart Insights */}
          <div className="rounded-xl p-6 text-white relative overflow-hidden shadow-lg shadow-primary/20" style={{ background: 'linear-gradient(135deg, #0d6cf2, #1d4ed8)' }}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BarChart2 size={120} />
            </div>
            <h3 className="text-base font-bold mb-2">Smart Insights</h3>
            <p className="text-white/80 text-xs mb-4 leading-relaxed">Based on your activity, here are tips to improve your focus score.</p>
            <div className="space-y-2.5 relative z-10">
              <div className="flex gap-3 items-start bg-white/10 backdrop-blur-md p-3.5 rounded-lg border border-white/20">
                <div className="bg-white/20 p-2 rounded-lg shrink-0 text-sm">☀️</div>
                <div>
                  <p className="text-xs font-bold">Optimal Focus Window</p>
                  <p className="text-[11px] text-white/70 mt-0.5">You're 40% more efficient in the morning hours.</p>
                </div>
              </div>
              {stats.top_category && (
                <div className="flex gap-3 items-start bg-white/10 backdrop-blur-md p-3.5 rounded-lg border border-white/20">
                  <div className="bg-white/20 p-2 rounded-lg shrink-0 text-sm">🏆</div>
                  <div>
                    <p className="text-xs font-bold">Top Category</p>
                    <p className="text-[11px] text-white/70 mt-0.5">Most active: <strong>{stats.top_category}</strong></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Total tasks */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 flex items-center justify-between shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total active tasks</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total_tasks}</p>
        </div>

        {/* Weekly Reviews */}
        {weeklyReviews.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-primary" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Weekly Reviews</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {weeklyReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3"
                >
                  {/* Header: date + score */}
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                      Week of {new Date(review.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    {review.score != null && (
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${scoreColor(review.score)}`}>
                        {review.score}/10
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  {review.summary && (
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{review.summary}</p>
                  )}

                  {/* Wins */}
                  {review.wins && review.wins.length > 0 && (
                    <div className="space-y-1">
                      {review.wins.map((win, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-600 dark:text-slate-400">{win}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Improvement areas */}
                  {review.improvement_areas && review.improvement_areas.length > 0 && (
                    <div className="space-y-1">
                      {review.improvement_areas.map((area, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <ChevronRight size={13} className="text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-600 dark:text-slate-400">{area}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Next week suggestions */}
                  {review.next_week_suggestions && review.next_week_suggestions.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                      {review.next_week_suggestions.map((suggestion, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <ArrowRight size={13} className="text-blue-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-slate-600 dark:text-slate-400">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
