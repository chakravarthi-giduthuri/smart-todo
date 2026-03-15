import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Bell, Sun, Moon, X } from 'lucide-react';
import { ChatBar } from '../components/chat/ChatBar';
import { TaskList } from '../components/tasks/TaskList';
import { EnergyBanner } from '../components/home/EnergyBanner';
import { SmartSuggestions } from '../components/home/SmartSuggestions';
import { useTasks, useCreateTask } from '../hooks/useTasks';
import { useTodayEnergy } from '../hooks/useEnergy';
import { useDashboard } from '../hooks/useDashboard';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function formatTodayDate() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const ENERGY_LABEL: Record<string, { label: string; color: string }> = {
  high:   { label: 'High Peak',  color: 'text-emerald-500' },
  medium: { label: 'Moderate',   color: 'text-amber-500'   },
  low:    { label: 'Low',        color: 'text-blue-500'    },
};

export function HomeScreen() {
  const { data: tasks = [], isLoading } = useTasks();
  const { isPending } = useCreateTask();
  const { theme, toggleTheme } = useThemeContext();
  const { data: energy } = useTodayEnergy();
  const { data: stats } = useDashboard();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sharedText, setSharedText] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBell, setShowBell] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shared = searchParams.get('text') ?? searchParams.get('title') ?? searchParams.get('url');
    if (shared) { setSharedText(shared); setSearchParams({}, { replace: true }); }
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayUpcoming = tasks.filter((t) => !t.is_completed && t.scheduled_date === today).slice(0, 5);
  const filteredTasks = searchQuery.trim()
    ? tasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : tasks;
  const incomplete = filteredTasks.filter((t) => !t.is_completed);
  const completed = filteredTasks.filter((t) => t.is_completed);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';
  const energyInfo = energy?.level ? ENERGY_LABEL[energy.level] : null;

  return (
    <div className="flex flex-col min-h-screen pb-36 md:pb-36" style={{ background: 'var(--app-bg)' }}>

      {/* Sticky header */}
      <header className="sticky top-0 z-10 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 md:px-8 flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, insights or schedules..."
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-9 pr-4 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X size={14} />
            </button>
          )}
        </div>
        {/* Right actions */}
        <div className="flex items-center gap-2">
          <div className="relative" ref={bellRef}>
            <button
              onClick={() => setShowBell((v) => !v)}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer relative"
            >
              <Bell size={18} />
              {todayUpcoming.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
            {showBell && (
              <div className="absolute right-0 top-11 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Today's Reminders</span>
                  <button onClick={() => setShowBell(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={14} /></button>
                </div>
                {todayUpcoming.length === 0 ? (
                  <p className="px-4 py-4 text-xs text-slate-400 italic">No upcoming tasks today.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {todayUpcoming.map((t) => (
                      <div key={t.id} className="px-4 py-3 flex items-start gap-3">
                        <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{t.title}</p>
                          {t.scheduled_time && <p className="text-xs text-slate-400">{t.scheduled_time.slice(0, 5)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-900 dark:text-white">Today</p>
            <p className="text-xs text-slate-500">{formatTodayDate()}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 md:p-8 max-w-6xl mx-auto w-full flex flex-col gap-8">

        {/* Welcome */}
        <section className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {getGreeting()}, {firstName} 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base mt-1 font-medium">
              {energyInfo
                ? <>Your energy is <span className={`font-bold ${energyInfo.color}`}>{energyInfo.label}</span> right now.</>
                : incomplete.length > 0
                  ? `You have ${incomplete.length} task${incomplete.length === 1 ? '' : 's'} to focus on today.`
                  : 'All clear — add a task below to get started.'
              }
            </p>
          </div>
        </section>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Energy */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                <span className="text-xl">⚡</span>
              </div>
              {energy?.level && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  energy.level === 'high' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' :
                  energy.level === 'medium' ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' :
                  'text-blue-600 bg-blue-50 dark:bg-blue-500/10'
                }`}>
                  {energy.level === 'high' ? '+5% trend' : 'Moderate'}
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Energy Level</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {energy?.level ? ENERGY_LABEL[energy.level].label : 'Not set'}
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 italic">
              Tap below to set today's energy
            </p>
          </div>

          {/* Tasks completed */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/5 rounded-lg">
                <span className="text-xl">✅</span>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                {stats?.completion_rate ?? 0}% Done
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Tasks Completed</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {completed.length} / {tasks.length}
            </h3>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0}%` }}
              />
            </div>
          </div>

          {/* Focus / Streak */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg">
                <span className="text-xl">🔥</span>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full">
                Strong
              </span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Day Streak</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {stats?.streak_days ?? 0} days
            </h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 italic">Keep it up!</p>
          </div>
        </div>

        {/* Energy picker */}
        <EnergyBanner />

        {/* 2-col grid: Suggestions + Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Smart Suggestions */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Smart Suggestions</h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Powered</span>
            </div>
            <SmartSuggestions energyLevel={energy?.level ?? undefined} tasks={filteredTasks} onSelect={(title) => setSharedText(title)} />
          </div>

          {/* Today's tasks */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Today's Tasks</h2>
              <span className="text-sm font-bold text-slate-400">{incomplete.length} remaining</span>
            </div>
            <TaskList tasks={filteredTasks} isLoading={isLoading} isPending={isPending} />
          </div>
        </div>

        {/* Productivity Flow */}
        {stats?.week_chart && stats.week_chart.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Predicted Productivity Flow</h2>
              <span className="text-xs text-slate-400 italic">Based on your activity</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-end gap-2 h-32">
                {stats.week_chart.map((bar, i) => {
                  const maxH = Math.max(...stats.week_chart.map(b => b.total), 1);
                  const h = Math.max((bar.total / maxH) * 100, 4);
                  const today = new Date().toISOString().split('T')[0];
                  const isToday = bar.date === today;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div
                        className="w-full rounded-t-lg transition-all"
                        style={{
                          height: `${h}%`,
                          background: isToday ? '#0d6cf2' : 'rgba(13,108,242,0.2)',
                        }}
                      />
                      <span className={`text-[10px] font-bold uppercase ${isToday ? 'text-primary' : 'text-slate-400 dark:text-slate-600'}`}>
                        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>

      <ChatBar energyLevel={energy?.level ?? undefined} prefill={sharedText ?? undefined} onPrefillConsumed={() => setSharedText(null)} />
    </div>
  );
}
