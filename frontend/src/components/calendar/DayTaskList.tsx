import type { Task } from '@/types/task';
import { TaskCard } from '../tasks/TaskCard';
import { formatDate } from '@/utils/dateFormat';
import { CalendarDays } from 'lucide-react';

interface Props { date: string; tasks: Task[]; }

export function DayTaskList({ date, tasks }: Props) {
  const dayTasks = tasks.filter((t) => t.scheduled_date === date).sort((a,b) => a.priority - b.priority);
  return (
    <div className="mt-2 border-t border-white/5 pt-4">
      <div className="flex items-center gap-2 px-4 mb-3">
        <CalendarDays size={14} className="text-indigo-400" />
        <span className="text-sm font-bold text-white">{formatDate(date)}</span>
        <span className="text-xs text-white/30 ml-auto">{dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}</span>
      </div>
      {dayTasks.length === 0
        ? <p className="px-4 text-sm text-white/25 pb-4">No tasks scheduled</p>
        : dayTasks.map((t) => <TaskCard key={t.id} task={t} />)
      }
    </div>
  );
}
