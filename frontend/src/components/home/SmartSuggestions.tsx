import { useState } from 'react';
import type { Task } from '../../types/task';
import type { EnergyLevel } from '../../types/task';
import { RefreshCw, Zap } from 'lucide-react';

interface Props { energyLevel?: EnergyLevel; tasks: Task[]; onSelect?: (title: string) => void; }

const ENERGY_LABELS: Record<EnergyLevel, { text: string; color: string }> = {
  high:   { text: 'High Energy',   color: 'text-yellow-500' },
  medium: { text: 'Medium Energy', color: 'text-orange-500' },
  low:    { text: 'Low Energy',    color: 'text-blue-500'   },
};

export function SmartSuggestions({ energyLevel, tasks, onSelect }: Props) {
  const [offset, setOffset] = useState(0);
  const incomplete = tasks.filter((t) => !t.is_completed);

  const pool = energyLevel === 'high'
    ? incomplete.filter((t) => t.priority <= 2)
    : energyLevel === 'medium'
    ? incomplete.filter((t) => t.priority >= 2 && t.priority <= 3)
    : incomplete.filter((t) => t.priority >= 4);

  const source = pool.length > 0 ? pool : incomplete;
  const shown = source.length > 0
    ? source.slice(offset % source.length, (offset % source.length) + 3).concat(
        source.slice(0, Math.max(0, 3 - (source.length - offset % source.length)))
      ).slice(0, 3)
    : [];

  const energyInfo = energyLevel ? ENERGY_LABELS[energyLevel] : null;

  function handleRefresh() {
    setOffset((prev) => prev + 3);
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
          <Zap size={14} className="text-primary" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">AI Suggestions</h3>
      </div>
      {energyInfo ? (
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
          Based on your <span className={`font-bold ${energyInfo.color}`}>{energyInfo.text}</span> level, tackle these:
        </p>
      ) : (
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">Set your energy level to get personalized suggestions.</p>
      )}

      {shown.length > 0 ? (
        <div className="space-y-2">
          {shown.map((task) => (
            <button
              key={task.id}
              onClick={() => onSelect?.(task.title)}
              className="w-full text-left bg-slate-50 dark:bg-slate-800 hover:bg-primary/5 dark:hover:bg-primary/10 border border-slate-200 dark:border-slate-700 hover:border-primary/40 p-3 rounded-xl transition-all cursor-pointer group"
            >
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate">{task.title}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {task.category} · {task.duration_minutes ? `${task.duration_minutes}m` : 'No duration'}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-sm text-center py-4">No tasks yet — add some below!</p>
      )}

      <button
        onClick={handleRefresh}
        className="mt-4 w-full py-2 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
      >
        <RefreshCw size={12} />
        Refresh Suggestions
      </button>
    </div>
  );
}
