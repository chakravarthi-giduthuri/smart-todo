import { memo } from 'react';
import type { Task } from '../../types/task';
import { TaskCard } from './TaskCard';
import { TaskCardSkeleton } from './TaskCardSkeleton';
import { useArchiveTask } from '../../hooks/useTasks';
import { Sparkles, AlertTriangle, Archive } from 'lucide-react';

interface Props { tasks: Task[]; isLoading?: boolean; isPending?: boolean; }

const PRIORITY_GROUPS = [
  { priority: 1, label: 'Critical', color: '#ef4444', dot: 'bg-red-500' },
  { priority: 2, label: 'High',     color: '#f97316', dot: 'bg-orange-500' },
  { priority: 3, label: 'Medium',   color: '#eab308', dot: 'bg-yellow-500' },
  { priority: 4, label: 'Low',      color: '#6366f1', dot: 'bg-indigo-400' },
  { priority: 5, label: 'Minimal',  color: '#6b7280', dot: 'bg-gray-500' },
];

function getTodayStr() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const TaskList = memo(function TaskList({ tasks, isLoading, isPending }: Props) {
  const { mutate: archive } = useArchiveTask();

  if (isLoading) {
    return <div className="pt-3">{[1, 2, 3].map((i) => <TaskCardSkeleton key={i} />)}</div>;
  }

  const today = getTodayStr();
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const threeDaysAgoStr = (() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${threeDaysAgo.getFullYear()}-${pad(threeDaysAgo.getMonth() + 1)}-${pad(threeDaysAgo.getDate())}`;
  })();

  const incomplete = tasks.filter((t) => !t.is_completed);
  const completed  = tasks.filter((t) => t.is_completed);
  const isEmpty    = incomplete.length === 0 && completed.length === 0 && !isPending;

  // Doom list: incomplete tasks overdue by 3+ days
  const doomList = incomplete.filter(
    (t) => t.scheduled_date && t.scheduled_date < threeDaysAgoStr
  );
  const activeTasks = incomplete.filter(
    (t) => !t.scheduled_date || t.scheduled_date >= threeDaysAgoStr
  );

  // Time overload warning: sum duration of today's incomplete tasks
  const todayMinutes = incomplete
    .filter((t) => t.scheduled_date === today && t.duration_minutes)
    .reduce((sum, t) => sum + (t.duration_minutes ?? 0), 0);
  const isOverloaded = todayMinutes > 480;

  return (
    <div className="pt-3 pb-2">
      {isPending && <TaskCardSkeleton />}

      {isEmpty && (
        <div className="flex flex-col items-center justify-center mt-20 px-8 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-gradient-accent flex items-center justify-center mb-4 shadow-xl shadow-blue-500/20">
            <Sparkles size={28} className="text-white" />
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white mb-1">All clear</p>
          <p className="text-sm text-gray-500 dark:text-white/40 text-center">Type anything below — your AI assistant will organize it</p>
        </div>
      )}

      {/* Time overload warning */}
      {isOverloaded && (
        <div className="mb-3 px-4 py-3 rounded-2xl border border-amber-500/20 flex items-start gap-3 animate-fade-in" style={{ background: 'rgba(245,158,11,0.08)' }}>
          <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-400">Day overloaded</p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              {Math.floor(todayMinutes / 60)}h {todayMinutes % 60}m scheduled today — consider moving some tasks
            </p>
          </div>
        </div>
      )}

      {/* Incomplete tasks — grouped by priority */}
      {PRIORITY_GROUPS.map(({ priority, label, color, dot }) => {
        const group = activeTasks
          .filter((t) => t.priority === priority)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        if (group.length === 0) return null;

        return (
          <div key={priority} className="mb-1">
            <div className="flex items-center gap-2 pt-3 pb-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>
                {label}
              </span>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-white/20">{group.length}</span>
            </div>
            {group.map((task, i) => (
              <TaskCard key={task.id} task={task} delay={i * 40} priorityColor={color} />
            ))}
          </div>
        );
      })}

      {/* Doom List — overdue 3+ days */}
      {doomList.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 pt-3 pb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500/70" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-rose-500/70">Doom List</span>
            <span className="text-[10px] font-semibold text-gray-500 dark:text-white/20">{doomList.length}</span>
            <span className="text-[10px] text-gray-400 dark:text-white/20 ml-auto">overdue 3+ days</span>
          </div>
          {doomList.map((task) => (
            <div key={task.id}>
              <TaskCard task={task} priorityColor="#ef4444" />
              <div className="flex justify-end -mt-2 mb-2">
                <button
                  onClick={() => archive(task.id)}
                  className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-white/30 hover:text-amber-400 bg-gray-100 dark:bg-white/5 hover:bg-amber-500/10 px-2.5 py-1 rounded-xl transition-all cursor-pointer active:scale-90"
                >
                  <Archive size={10} />
                  <span>Archive</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed tasks */}
      {completed.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 pt-3 pb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500/50">Done</span>
            <span className="text-[10px] font-semibold text-gray-500 dark:text-white/20">{completed.length}</span>
          </div>
          {completed.map((task, i) => (
            <TaskCard key={task.id} task={task} delay={i * 30} priorityColor="#6b7280" />
          ))}
        </div>
      )}
    </div>
  );
});
