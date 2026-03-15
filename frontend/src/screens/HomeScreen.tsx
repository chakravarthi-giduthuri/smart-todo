import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sun, Moon, Zap } from 'lucide-react';
import { ChatBar } from '../components/chat/ChatBar';
import { TaskList } from '../components/tasks/TaskList';
import { EnergyBanner } from '../components/home/EnergyBanner';
import { FocusModeButton } from '../components/home/FocusModeButton';
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
    if (shared) {
      setSharedText(shared);
      setSearchParams({}, { replace: true });
    }
  }, []);

  const incomplete = tasks.filter((t) => !t.is_completed);
  const completed  = tasks.filter((t) => t.is_completed);
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="min-h-screen bg-[#0A0A14] flex flex-col">
      {/* Fixed top header */}
      <div className="fixed top-0 left-0 right-0 z-40 pt-safe bg-[#0A0A14]/90 backdrop-blur-xl border-b border-white/5 animate-slide-down">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center animate-float" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}>
                <Zap size={13} className="text-white" fill="white" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">Smart To-Do</span>
            </div>
            <p className="text-xs text-white/40 mt-0.5 ml-9 animate-fade-in stagger-3">{getGreeting()}, {firstName} 👋</p>
          </div>

          <div className="flex items-center gap-3">
            {!isLoading && tasks.length > 0 && (
              <div className="flex items-center gap-2">
                {completed.length > 0 && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg">{completed.length} done</span>
                )}
                <span className="text-xs font-semibold text-white/30">{incomplete.length} left</span>
              </div>
            )}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200 cursor-pointer active:scale-90"
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-below-header pb-40">
        <div className="pt-3">
          <EnergyBanner />
          <FocusModeButton tasks={tasks} />
        </div>
        <TaskList tasks={tasks} isLoading={isLoading} isPending={isPending} />
      </div>

      <ChatBar energyLevel={energy?.level ?? undefined} prefill={sharedText ?? undefined} onPrefillConsumed={() => setSharedText(null)} />
    </div>
  );
}
