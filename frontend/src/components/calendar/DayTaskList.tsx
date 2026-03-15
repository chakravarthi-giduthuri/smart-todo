import type { Task } from '@/types/task';
import { TaskCard } from '../tasks/TaskCard';
import { formatDate } from '@/utils/dateFormat';
import { CalendarDays } from 'lucide-react';

interface Props { date: string; tasks: Task[]; }

export function DayTaskList({ date, tasks }: Props) {
  const dayTasks = tasks.filter((t) => t.scheduled_date === date).sort((a,b) => a.priority - b.priority);
  return (
    <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
      <div className="flex items-center gap-2 px-1 mb-3">
        <CalendarDays size={14} className="text-primary" />
        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(date)}</span>
        <span className="text-xs text-slate-400 ml-auto">{dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}</span>
      </div>
      {dayTasks.length === 0
        ? <p className="text-sm text-slate-400 pb-4">No tasks scheduled for this day</p>
        : <div className="space-y-2">{dayTasks.map((t) => <TaskCard key={t.id} task={t} />)}</div>
      }
    </div>
  );
}
