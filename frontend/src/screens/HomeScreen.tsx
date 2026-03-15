import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Sun, Moon } from 'lucide-react';
import { ChatBar } from '../components/chat/ChatBar';
import { TaskList } from '../components/tasks/TaskList';
import { EnergyBanner } from '../components/home/EnergyBanner';
import { FocusModeButton } from '../components/home/FocusModeButton';
import { useTasks, useCreateTask } from '../hooks/useTasks';
import { useTodayEnergy } from '../hooks/useEnergy';
import { useThemeContext } from '../contexts/ThemeContext';

export function HomeScreen() {
  const { data: tasks = [], isLoading } = useTasks();
  const { isPending } = useCreateTask();
  const { theme, toggleTheme } = useThemeContext();
  const { data: energy } = useTodayEnergy();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sharedText, setSharedText] = useState<string | null>(null);

  // Handle PWA Web Share Target
  useEffect(() => {
    const shared = searchParams.get('text') ?? searchParams.get('title') ?? searchParams.get('url');
    if (shared) {
      setSharedText(shared);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const incomplete = tasks.filter((t) => !t.is_completed);
  const completed  = tasks.filter((t) => t.is_completed);

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col">
      {/* Fixed top header */}
      <div className="fixed top-0 left-0 right-0 z-40 pt-safe bg-[#080810]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-accent flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles size={13} className="text-white" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Smart To-Do</span>
          </div>

          <div className="flex items-center gap-2">
            {!isLoading && tasks.length > 0 && (
              <>
                <span className="text-xs font-semibold text-white/30">{incomplete.length} left</span>
                {completed.length > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-white/10" />
                    <span className="text-xs font-semibold text-emerald-500/60">{completed.length} done</span>
                  </>
                )}
              </>
            )}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer active:scale-90 ml-1"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable task list — padded top (header) and bottom (chat bar + nav) */}
      <div className="flex-1 overflow-y-auto pt-below-header pb-40">
        <div className="pt-3">
          <EnergyBanner />
          <FocusModeButton tasks={tasks} />
        </div>
        <TaskList tasks={tasks} isLoading={isLoading} isPending={isPending} />
      </div>

      {/* Bottom chat input (above nav bar) */}
      <ChatBar energyLevel={energy?.level ?? undefined} prefill={sharedText ?? undefined} onPrefillConsumed={() => setSharedText(null)} />
    </div>
  );
}
