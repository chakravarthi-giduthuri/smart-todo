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
    <div className="min-h-screen flex flex-col" style={{ background: '#1a0f08' }}>
      {/* Fixed top header */}
      <div
        className="fixed top-0 left-0 right-0 z-40 pt-safe animate-slide-down"
        style={{ background: 'rgba(26,15,8,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 animate-float"
              style={{ background: 'linear-gradient(135deg, #ec5b13, #f97316)' }}
            >
              <Zap size={14} className="text-white" fill="white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight">Smart To-Do</span>
              <p className="text-[11px] text-white/35 mt-0 animate-fade-in stagger-3">{getGreeting()}, {firstName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLoading && tasks.length > 0 && (
              <div className="flex items-center gap-1.5">
                {completed.length > 0 && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">{completed.length} done</span>
                )}
                <span className="text-[11px] font-semibold text-white/30">{incomplete.length} left</span>
              </div>
            )}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/35 hover:text-white/70 hover:bg-white/8 transition-all duration-200 cursor-pointer active:scale-90"
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
