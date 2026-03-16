import { AlertTriangle } from 'lucide-react';
import type { Task } from '../../types/task';

interface CapacityBarProps {
  tasks: Task[];
}

const CAPACITY_MINUTES = 480; // 8h working day
const WARNING_MINUTES = 360;  // 6h warning threshold
const SOFT_WARNING_MINUTES = 300; // 5h — turn amber

export function CapacityBar({ tasks }: CapacityBarProps) {
  const today = new Date().toISOString().split('T')[0];

  const todayTasks = tasks.filter(
    (t) => !t.is_completed && t.scheduled_date === today && t.duration_minutes != null
  );

  if (todayTasks.length === 0) return null;

  const totalMinutes = todayTasks.reduce((sum, t) => sum + (t.duration_minutes ?? 0), 0);

  const fillPct = Math.min((totalMinutes / CAPACITY_MINUTES) * 100, 100);
  const isOver = totalMinutes > WARNING_MINUTES;
  const isSoftWarning = totalMinutes >= SOFT_WARNING_MINUTES && totalMinutes <= WARNING_MINUTES;

  const fillColor = isOver
    ? 'bg-red-500'
    : isSoftWarning
    ? 'bg-amber-500'
    : 'bg-emerald-500';

  const labelColor = isOver
    ? 'text-red-600 dark:text-red-400'
    : isSoftWarning
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-emerald-600 dark:text-emerald-400';

  const hours = (totalMinutes / 60).toFixed(1);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOver && <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
          <span className={`text-sm font-semibold ${labelColor}`}>
            {hours} hrs scheduled today
          </span>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          of {CAPACITY_MINUTES / 60}h capacity
        </span>
      </div>

      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${fillColor}`}
          style={{ width: `${fillPct}%` }}
        />
      </div>

      {isOver && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-500/10 rounded-lg border border-amber-200 dark:border-amber-500/20">
          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            You're over capacity — consider rescheduling some tasks
          </span>
        </div>
      )}
    </div>
  );
}
