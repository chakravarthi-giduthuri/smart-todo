import type { Task } from '../../types/task';
import { TaskCard } from './TaskCard';
import { TaskCardSkeleton } from './TaskCardSkeleton';
import { Sparkles } from 'lucide-react';

interface Props { tasks: Task[]; isLoading?: boolean; isPending?: boolean; }

const PRIORITY_GROUPS = [
  { priority: 1, label: 'Critical', color: '#ef4444', dot: 'bg-red-500' },
  { priority: 2, label: 'High',     color: '#f97316', dot: 'bg-orange-500' },
  { priority: 3, label: 'Medium',   color: '#eab308', dot: 'bg-yellow-500' },
  { priority: 4, label: 'Low',      color: '#6366f1', dot: 'bg-indigo-400' },
  { priority: 5, label: 'Minimal',  color: '#6b7280', dot: 'bg-gray-500' },
];

export function TaskList({ tasks, isLoading, isPending }: Props) {
  if (isLoading) {
    return <div className="pt-3">{[1, 2, 3].map((i) => <TaskCardSkeleton key={i} />)}</div>;
  }

  const incomplete = tasks.filter((t) => !t.is_completed);
  const completed  = tasks.filter((t) => t.is_completed);
  const isEmpty    = incomplete.length === 0 && completed.length === 0 && !isPending;

  return (
    <div className="pt-3 pb-2">
      {isPending && <TaskCardSkeleton />}

      {isEmpty && (
        <div className="flex flex-col items-center justify-center mt-20 px-8 animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-gradient-accent flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/30">
            <Sparkles size={28} className="text-white" />
          </div>
          <p className="text-lg font-bold text-white mb-1">All clear</p>
          <p className="text-sm text-white/40 text-center">Type anything below — your AI assistant will organize it</p>
        </div>
      )}

      {/* Incomplete tasks — grouped by priority */}
      {PRIORITY_GROUPS.map(({ priority, label, color, dot }) => {
        const group = incomplete
          .filter((t) => t.priority === priority)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        if (group.length === 0) return null;

        return (
          <div key={priority} className="mb-1">
            <div className="flex items-center gap-2 px-5 pt-3 pb-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>
                {label}
              </span>
              <span className="text-[10px] font-semibold text-white/20">{group.length}</span>
            </div>
            {group.map((task, i) => (
              <TaskCard key={task.id} task={task} delay={i * 40} priorityColor={color} />
            ))}
          </div>
        );
      })}

      {/* Completed tasks */}
      {completed.length > 0 && (
        <div className="mt-2">
          <div className="flex items-center gap-2 px-5 pt-3 pb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-500/50">Done</span>
            <span className="text-[10px] font-semibold text-white/20">{completed.length}</span>
          </div>
          {completed.map((task, i) => (
            <TaskCard key={task.id} task={task} delay={i * 30} priorityColor="#6b7280" />
          ))}
        </div>
      )}
    </div>
  );
}
