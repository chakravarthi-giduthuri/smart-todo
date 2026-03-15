import { PageShell } from '../components/layout/PageShell';
import { NotificationToggle } from '../components/settings/NotificationToggle';
import { AiLearningJournal } from '../components/settings/AiLearningJournal';
import { ResetAiButton } from '../components/settings/ResetAiButton';
import { Settings, Sun, Moon, Globe } from 'lucide-react';
import { useThemeContext } from '../contexts/ThemeContext';
import { getLocalTimezone } from '../utils/dateFormat';

export function SettingsScreen() {
  const { theme, toggleTheme } = useThemeContext();

  return (
    <PageShell className="p-4 pt-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-accent flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <Settings size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold text-white leading-none">Settings</h1>
          <p className="text-xs text-white/30 mt-0.5">Smart To-Do preferences</p>
        </div>
      </div>
      <div className="space-y-3">
        {/* Theme toggle */}
        <div className="glass rounded-2xl px-4 py-3.5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-white">Appearance</p>
            <p className="text-xs text-white/40 mt-0.5">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</p>
          </div>
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-12 h-7 rounded-full relative transition-all duration-300 cursor-pointer focus:outline-none"
            style={{ background: theme === 'light' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.12)' }}
          >
            <span
              className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-300"
              style={{ left: theme === 'light' ? '22px' : '2px' }}
            >
              {theme === 'dark' ? <Moon size={12} className="text-indigo-500" /> : <Sun size={12} className="text-indigo-500" />}
            </span>
          </button>
        </div>

        {/* Timezone — auto-detected, no permission needed */}
        <div className="glass rounded-2xl px-4 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
            <Globe size={15} className="text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Timezone</p>
            <p className="text-xs text-white/40 mt-0.5 truncate">{getLocalTimezone()}</p>
          </div>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg shrink-0">Auto</span>
        </div>

        <NotificationToggle />
        <AiLearningJournal />
        <ResetAiButton />
      </div>
    </PageShell>
  );
}
