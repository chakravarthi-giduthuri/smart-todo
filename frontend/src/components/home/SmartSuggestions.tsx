import { useState } from 'react';
import type { Task } from '../../types/task';
import type { EnergyLevel } from '../../types/task';
import { RefreshCw, Zap, Clock, AlertCircle, TrendingUp } from 'lucide-react';

interface Props { energyLevel?: EnergyLevel; tasks: Task[]; onSelect?: (title: string) => void; }

const ENERGY_LABELS: Record<EnergyLevel, { text: string; color: string }> = {
  high:   { text: 'High Energy',   color: 'text-yellow-500' },
  medium: { text: 'Medium Energy', color: 'text-orange-500' },
  low:    { text: 'Low Energy',    color: 'text-blue-500'   },
};

// Category affinity per energy level
const ENERGY_CATEGORIES: Record<EnergyLevel, string[]> = {
  high:   ['Work', 'Study'],
  medium: ['Work', 'Personal', 'Errand'],
  low:    ['Personal', 'Health', 'Errand'],
};

function scoreTask(task: Task, today: string, tomorrow: string, energyLevel?: EnergyLevel): number {
  let score = 0;

  // Priority (1=critical gets most points)
  score += (6 - task.priority) * 12; // 1→60, 2→48, 3→36, 4→24, 5→12

  // Urgency
  if (task.scheduled_date) {
    if (task.scheduled_date < today)  score += 40; // overdue
    else if (task.scheduled_date === today)    score += 25; // due today
    else if (task.scheduled_date === tomorrow) score += 10; // due tomorrow
  } else {
    score += 5; // undated — slightly deprioritised
  }

  // Energy level match
  if (energyLevel && task.category) {
    const affinity = ENERGY_CATEGORIES[energyLevel];
    if (affinity.includes(task.category)) score += 15;
  }

  // Prefer tasks with a time set (more actionable)
  if (task.scheduled_time) score += 5;

  // Quick wins: @5min context tag
  if (task.context_tags?.includes('@5min')) score += 8;

  return score;
}

export function SmartSuggestions({ energyLevel, tasks, onSelect }: Props) {
  const [page, setPage] = useState(0);
  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

  const incomplete = tasks.filter((t) => !t.is_completed && !t.is_archived);

  // Score + sort all incomplete tasks
  const ranked = [...incomplete]
    .map((t) => ({ task: t, score: scoreTask(t, today, tomorrow, energyLevel) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.task);

  const PAGE_SIZE = 3;
  const totalPages = Math.ceil(ranked.length / PAGE_SIZE);
  const shown = ranked.slice((page % (totalPages || 1)) * PAGE_SIZE, ((page % (totalPages || 1)) * PAGE_SIZE) + PAGE_SIZE);

  const energyInfo = energyLevel ? ENERGY_LABELS[energyLevel] : null;

  function urgencyLabel(task: Task) {
    if (!task.scheduled_date) return null;
    if (task.scheduled_date < today)    return { text: 'Overdue',   cls: 'text-rose-500' };
    if (task.scheduled_date === today)   return { text: 'Due today', cls: 'text-amber-500' };
    if (task.scheduled_date === tomorrow) return { text: 'Tomorrow', cls: 'text-blue-400' };
    return null;
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
          Based on your <span className={`font-bold ${energyInfo.color}`}>{energyInfo.text}</span>, focus on these:
        </p>
      ) : (
        <p className="text-slate-500 dark:text-slate-400 text-xs mb-4">
          Top tasks ranked by priority &amp; urgency:
        </p>
      )}

      {shown.length > 0 ? (
        <div className="space-y-2">
          {shown.map((task) => {
            const urgency = urgencyLabel(task);
            return (
              <button
                key={task.id}
                onClick={() => onSelect?.(task.title)}
                className="w-full text-left bg-slate-50 dark:bg-slate-800 hover:bg-primary/5 dark:hover:bg-primary/10 border border-slate-200 dark:border-slate-700 hover:border-primary/40 p-3 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate flex-1">
                    {task.title}
                  </p>
                  {urgency && (
                    <span className={`text-[10px] font-bold shrink-0 flex items-center gap-0.5 ${urgency.cls}`}>
                      <AlertCircle size={9} />
                      {urgency.text}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-slate-400">{task.category}</span>
                  {task.scheduled_time && (
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                      <Clock size={8} /> {task.scheduled_time.slice(0, 5)}
                    </span>
                  )}
                  {task.duration_minutes && (
                    <span className="text-[10px] text-slate-400">{task.duration_minutes}m</span>
                  )}
                  <span className="ml-auto">
                    {[1,2,3,4,5].map((p) => (
                      <span key={p} className={`inline-block w-1 h-1 rounded-full mr-0.5 ${p <= task.priority ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    ))}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6">
          <TrendingUp size={24} className="text-slate-300 dark:text-slate-600" />
          <p className="text-slate-400 text-sm text-center">All caught up! Add tasks below.</p>
        </div>
      )}

      {ranked.length > PAGE_SIZE && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="mt-4 w-full py-2 flex items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw size={12} />
          Next suggestions
        </button>
      )}
    </div>
  );
}
