import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sun, Moon, Search } from 'lucide-react';
import { ChatBar } from '../components/chat/ChatBar';
import { TaskList } from '../components/tasks/TaskList';
import { EnergyBanner } from '../components/home/EnergyBanner';
import { ProductivitySnapshot } from '../components/home/ProductivitySnapshot';
import { SmartSuggestions } from '../components/home/SmartSuggestions';
import { useTasks, useCreateTask } from '../hooks/useTasks';
import { useTodayEnergy } from '../hooks/useEnergy';
import { useThemeContext } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const { data: tasks = [], isLoading } = useTasks();
  const { isPending } = useCreateTask();
  const { theme, toggleTheme } = useThemeContext();
  const { data: energy } = useTodayEnergy();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sharedText, setSharedText] = useState<string | null>(null);

  useEffect(() => {
    const shared = searchParams.get('text') ?? searchParams.get('title') ?? searchParams.get('url');
    if (shared) { setSharedText(shared); setSearchParams({}, { replace: true }); }
  }, []);

  const incomplete = tasks.filter((t) => !t.is_completed);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="min-h-screen pb-32" style={{ background: 'var(--app-bg)' }}>
      {/* Header */}
      <header className="px-8 pt-8 pb-6 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{getGreeting()}, {firstName}!</h2>
          <p className="text-gray-500 dark:text-white/50 mt-1">
            {incomplete.length > 0
              ? `You have ${incomplete.length} task${incomplete.length === 1 ? '' : 's'} to focus on today.`
              : 'All clear — add a task below to get started.'}
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <button className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 dark:text-white/40 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:text-gray-600 dark:hover:text-white/70 transition-colors cursor-pointer">
            <Search size={16} />
          </button>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 dark:text-white/40 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:text-gray-600 dark:hover:text-white/70 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      {/* 12-col grid */}
      <div className="px-8 grid grid-cols-12 gap-8">
        {/* Left column: Energy + Tasks */}
        <div className="col-span-8 space-y-8">
          <EnergyBanner />

          {/* Today's Tasks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Tasks</h3>
              <span className="text-sm text-gray-400 dark:text-white/30">{incomplete.length} remaining</span>
            </div>
            <TaskList tasks={tasks} isLoading={isLoading} isPending={isPending} />
          </section>
        </div>

        {/* Right column: Widgets */}
        <div className="col-span-4 space-y-6">
          <ProductivitySnapshot />
          <SmartSuggestions energyLevel={energy?.level ?? undefined} tasks={tasks} />
        </div>
      </div>

      <ChatBar energyLevel={energy?.level ?? undefined} prefill={sharedText ?? undefined} onPrefillConsumed={() => setSharedText(null)} />
    </div>
  );
}
