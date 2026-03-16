import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Bell, Sun, Moon, X, Zap, Calendar, Clock, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { ChatBar } from '../components/chat/ChatBar';
import { TaskList } from '../components/tasks/TaskList';
import { EnergyBanner } from '../components/home/EnergyBanner';
import { SmartSuggestions } from '../components/home/SmartSuggestions';
import { useTasks, useCreateTask } from '../hooks/useTasks';
import { useTodayEnergy } from '../hooks/useEnergy';
import { useDashboard } from '../hooks/useDashboard';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmt12h(time: string | null): string {
  if (!time) return '';
  const [h, m] = time.slice(0, 5).split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function getRelativeTime(scheduledTime: string): string {
  const now = new Date();
  const [h, m] = scheduledTime.slice(0, 5).split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const diffMin = Math.round((target.getTime() - now.getTime()) / 60000);
  if (diffMin <= 0) return 'Now';
  if (diffMin < 60) return `in ${diffMin}m`;
  return `in ${Math.round(diffMin / 60)}h`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Work:     'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  Study:    'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
  Personal: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  Health:   'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
  Errand:   'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400',
};

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
  const [showAllFuture, setShowAllFuture] = useState(false);
  const [expandedTile, setExpandedTile] = useState<'energy' | 'tasks' | 'streak' | null>(null);
  const [showEnergy, setShowEnergy] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shared = searchParams.get('text') ?? searchParams.get('title') ?? searchParams.get('url');
    if (shared) { setSharedText(shared); setSearchParams({}, { replace: true }); }
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = getTomorrowStr();
  const now = new Date();
  const todayUpcoming = tasks.filter((t) => !t.is_completed && t.scheduled_date === today).slice(0, 5);

  // Today's progress
  const todayTasks = tasks.filter((t) => t.scheduled_date === today);
  const todayDone  = todayTasks.filter((t) => t.is_completed).length;
  const todayTotal = todayTasks.length;
  const todayPct   = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  // Upcoming in next hour
  const upcomingNextHour = tasks
    .filter((t) => {
      if (t.is_completed || t.scheduled_date !== today || !t.scheduled_time) return false;
      const [h, m] = t.scheduled_time.slice(0, 5).split(':').map(Number);
      const taskTime = new Date(now);
      taskTime.setHours(h, m, 0, 0);
      const diffMin = (taskTime.getTime() - now.getTime()) / 60000;
      return diffMin >= 0 && diffMin <= 60;
    })
    .sort((a, b) => (a.scheduled_time! < b.scheduled_time! ? -1 : 1));

  // Future tasks — tomorrow onward
  const futureTasks = tasks
    .filter((t) => !t.is_completed && t.scheduled_date && t.scheduled_date >= tomorrow)
    .sort((a, b) => {
      const da = `${a.scheduled_date ?? ''}${a.scheduled_time ?? ''}`;
      const db = `${b.scheduled_date ?? ''}${b.scheduled_time ?? ''}`;
      return da < db ? -1 : 1;
    });
  const visibleFuture = showAllFuture ? futureTasks : futureTasks.slice(0, 3);
  const hiddenFutureCount = futureTasks.length - 3;
  const filteredTasks = searchQuery.trim()
    ? tasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : tasks;
  // Today's Tasks: only tasks explicitly scheduled for today or overdue — never undated or future tasks
  const todayAndOverdueTasks = filteredTasks.filter(
    (t) => t.scheduled_date && t.scheduled_date <= today
  );
  const incomplete = todayAndOverdueTasks.filter((t) => !t.is_completed);
  const completed = filteredTasks.filter((t) => t.is_completed);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';
  const energyInfo = energy?.level ? ENERGY_LABEL[energy.level] : null;

  return (
    <div className="flex flex-col min-h-screen pb-52 md:pb-36" style={{ background: 'var(--app-bg)' }}>

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

        {/* Stats — mobile: compact 3 tiles, desktop: full cards */}

        {/* Mobile compact tiles */}
        <div className="sm:hidden flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            {/* Energy tile */}
            <button
              onClick={() => setExpandedTile(expandedTile === 'energy' ? null : 'energy')}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
                expandedTile === 'energy'
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/40'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-lg">⚡</span>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-none">Energy</p>
              <p className={`text-xs font-black leading-none ${expandedTile === 'energy' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                {energy?.level ? ENERGY_LABEL[energy.level].label : 'Not set'}
              </p>
            </button>

            {/* Tasks tile */}
            <button
              onClick={() => setExpandedTile(expandedTile === 'tasks' ? null : 'tasks')}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
                expandedTile === 'tasks'
                  ? 'bg-primary/5 border-primary/40'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-lg">✅</span>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-none">Tasks</p>
              <p className={`text-xs font-black leading-none ${expandedTile === 'tasks' ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
                {completed.length}/{tasks.length}
              </p>
            </button>

            {/* Streak tile */}
            <button
              onClick={() => setExpandedTile(expandedTile === 'streak' ? null : 'streak')}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
                expandedTile === 'streak'
                  ? 'bg-amber-50 dark:bg-amber-500/15 border-amber-300 dark:border-amber-500/40'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-lg">🔥</span>
              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 leading-none">Streak</p>
              <p className={`text-xs font-black leading-none ${expandedTile === 'streak' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {stats?.streak_days ?? 0}d
              </p>
            </button>
          </div>

          {/* Expanded detail panel */}
          {expandedTile === 'energy' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-emerald-200 dark:border-emerald-500/30 shadow-sm animate-fade-in">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><span className="text-xl">⚡</span></div>
                {energy?.level && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    energy.level === 'high' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' :
                    energy.level === 'medium' ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' :
                    'text-blue-600 bg-blue-50 dark:bg-blue-500/10'
                  }`}>{ENERGY_LABEL[energy.level].label}</span>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Energy Level</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{energy?.level ? ENERGY_LABEL[energy.level].label : 'Not set'}</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 italic">Tap below to set today's energy</p>
            </div>
          )}
          {expandedTile === 'tasks' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-primary/30 shadow-sm animate-fade-in">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-primary/5 rounded-lg"><span className="text-xl">✅</span></div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">{stats?.completion_rate ?? 0}% Done</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Tasks Completed</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{completed.length} / {tasks.length}</h3>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-primary h-full transition-all" style={{ width: `${tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0}%` }} />
              </div>
            </div>
          )}
          {expandedTile === 'streak' && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-amber-200 dark:border-amber-500/30 shadow-sm animate-fade-in">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg"><span className="text-xl">🔥</span></div>
                <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full">Strong</span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Day Streak</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats?.streak_days ?? 0} days</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 italic">Keep it up!</p>
            </div>
          )}
        </div>

        {/* Desktop full cards */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><span className="text-xl">⚡</span></div>
              {energy?.level && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                  energy.level === 'high' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10' :
                  energy.level === 'medium' ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10' :
                  'text-blue-600 bg-blue-50 dark:bg-blue-500/10'
                }`}>{energy.level === 'high' ? '+5% trend' : 'Moderate'}</span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Energy Level</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{energy?.level ? ENERGY_LABEL[energy.level].label : 'Not set'}</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 italic">Tap below to set today's energy</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-primary/5 rounded-lg"><span className="text-xl">✅</span></div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">{stats?.completion_rate ?? 0}% Done</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Tasks Completed</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{completed.length} / {tasks.length}</h3>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-primary h-full transition-all" style={{ width: `${tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0}%` }} />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg"><span className="text-xl">🔥</span></div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-full">Strong</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">Day Streak</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats?.streak_days ?? 0} days</h3>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 italic">Keep it up!</p>
          </div>
        </div>

        {/* Energy picker — mobile: collapsible, desktop: always shown */}
        <div>
          <button
            className="sm:hidden w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm cursor-pointer"
            onClick={() => setShowEnergy((v) => !v)}
          >
            <span className="text-sm font-bold text-slate-900 dark:text-white">⚡ How's your energy today?</span>
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${showEnergy ? 'rotate-180' : ''}`} />
          </button>
          <div className={`${showEnergy ? 'block' : 'hidden'} sm:block mt-2 sm:mt-0`}>
            <EnergyBanner />
          </div>
        </div>

        {/* 2-col grid: Suggestions + Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Smart Suggestions — mobile: collapsible, desktop: always shown */}
          <div className="flex flex-col gap-3">
            {/* Mobile toggle */}
            <button
              className="sm:hidden flex items-center justify-between cursor-pointer"
              onClick={() => setShowSuggestions((v) => !v)}
            >
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white text-left">Smart Suggestions</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Powered</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${showSuggestions ? 'rotate-180' : ''}`} />
              </div>
            </button>
            {/* Desktop header */}
            <div className="hidden sm:flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Smart Suggestions</h2>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Powered</span>
            </div>
            {/* Content */}
            <div className={`${showSuggestions ? 'block' : 'hidden'} sm:block`}>
              <SmartSuggestions energyLevel={energy?.level ?? undefined} tasks={filteredTasks} onSelect={(title) => setSharedText(title)} />
            </div>
          </div>

          {/* Today's tasks — incomplete only (completed moved to bottom) */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Today's Tasks</h2>
              <span className="text-sm font-bold text-slate-400">{incomplete.length} remaining</span>
            </div>
            <TaskList tasks={todayAndOverdueTasks.filter((t) => !t.is_completed)} isLoading={isLoading} isPending={isPending} />
          </div>
        </div>

        {/* Today's Progress */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Today's Progress</h2>
              <p className="text-xs text-slate-400 mt-0.5">{todayDone} of {todayTotal} tasks completed</p>
            </div>
            <span className={`text-2xl font-black ${
              todayPct === 100 ? 'text-emerald-500' : todayPct >= 50 ? 'text-primary' : 'text-slate-400 dark:text-slate-500'
            }`}>{todayPct}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${todayPct}%`,
                background: todayPct === 100 ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#0d6cf2,#3b82f6)',
              }}
            />
          </div>
          {todayTotal === 0 && <p className="text-xs text-slate-400 mt-2 italic">No tasks scheduled for today.</p>}
        </div>

        {/* Upcoming in Next Hour */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                <Zap size={15} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming</h3>
                <p className="text-xs text-slate-400">Tasks in the next hour</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              upcomingNextHour.length > 0
                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>{upcomingNextHour.length}</span>
          </div>
          {upcomingNextHour.length === 0 ? (
            <div className="px-5 py-7 text-center">
              <p className="text-sm text-slate-400 italic">Nothing scheduled in the next hour.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcomingNextHour.map((task) => {
                const relTime = getRelativeTime(task.scheduled_time!);
                const isNow = relTime === 'Now';
                return (
                  <div key={task.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className={`shrink-0 min-w-[52px] text-center px-2 py-1 rounded-lg ${isNow ? 'bg-red-50 dark:bg-red-500/15 text-red-500' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                      <p className="text-[10px] font-black leading-none">{isNow ? 'NOW' : relTime}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{fmt12h(task.scheduled_time)}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[task.category] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{task.category}</span>
                        {task.duration_minutes && <span className="flex items-center gap-0.5 text-[11px] text-slate-400"><Clock size={10} />{task.duration_minutes}m</span>}
                      </div>
                    </div>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      task.priority === 1 ? 'bg-red-100 dark:bg-red-500/20 text-red-500' :
                      task.priority === 2 ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-500' :
                      task.priority === 3 ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>{task.priority}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Future Tasks */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar size={15} className="text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Future Tasks</h3>
                <p className="text-xs text-slate-400">From tomorrow onwards</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{futureTasks.length}</span>
          </div>
          {futureTasks.length === 0 ? (
            <div className="px-5 py-7 text-center">
              <p className="text-sm text-slate-400">No future tasks scheduled.</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleFuture.map((task) => (
                  <div key={task.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className="shrink-0 min-w-[52px] text-center px-2 py-1 rounded-lg bg-primary/5 dark:bg-primary/10">
                      <p className="text-[10px] font-black text-primary leading-none">
                        {task.scheduled_date === tomorrow ? 'TMR' : new Date(task.scheduled_date! + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
                      </p>
                      {task.scheduled_time && <p className="text-[10px] text-slate-400 mt-0.5">{fmt12h(task.scheduled_time)}</p>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[task.category] ?? 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{task.category}</span>
                        {task.scheduled_date === tomorrow ? (
                          <span className="flex items-center gap-1 text-[11px] text-primary font-semibold"><ArrowRight size={10} />Tomorrow</span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-slate-400"><Calendar size={10} />{task.scheduled_date}</span>
                        )}
                      </div>
                    </div>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                      task.priority === 1 ? 'bg-red-100 dark:bg-red-500/20 text-red-500' :
                      task.priority === 2 ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-500' :
                      task.priority === 3 ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>{task.priority}</span>
                  </div>
                ))}
              </div>
              {futureTasks.length > 3 && (
                <button
                  onClick={() => setShowAllFuture((v) => !v)}
                  className="w-full flex items-center justify-center gap-2 py-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {showAllFuture ? <><ChevronUp size={13} />Show less</> : <><ChevronDown size={13} />{hiddenFutureCount} more task{hiddenFutureCount !== 1 ? 's' : ''}</>}
                </button>
              )}
            </>
          )}
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

      {/* Done section — all completed tasks at the very bottom */}
      {completed.length > 0 && (
        <div className="px-6 md:px-8 max-w-6xl mx-auto w-full pb-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500/50" />
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-500/70">Done</span>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">{completed.length}</span>
            </div>
            <TaskList tasks={completed} isLoading={false} isPending={false} />
          </div>
        </div>
      )}

      <ChatBar energyLevel={energy?.level ?? undefined} prefill={sharedText ?? undefined} onPrefillConsumed={() => setSharedText(null)} />
    </div>
  );
}
