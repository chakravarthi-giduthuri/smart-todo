import { useState, useRef } from 'react';
import type { Task } from '@/types/task';
import { TaskCard } from '../tasks/TaskCard';
import { formatDate } from '@/utils/dateFormat';
import { CalendarDays, Plus, Loader2 } from 'lucide-react';
import { useCreateTask } from '@/hooks/useTasks';

interface Props { date: string; tasks: Task[]; }

export function DayTaskList({ date, tasks }: Props) {
  const dayTasks = tasks.filter((t) => t.scheduled_date === date).sort((a,b) => a.priority - b.priority);
  const [showAdd, setShowAdd] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const create = useCreateTask();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || create.isPending) return;
    // Pass current_date matching the selected calendar date so Claude schedules for that day
    const off = -new Date().getTimezoneOffset();
    const sign = off >= 0 ? '+' : '-';
    const pad = (n: number) => String(n).padStart(2, '0');
    const tz = `${sign}${pad(Math.floor(Math.abs(off)/60))}:${pad(Math.abs(off)%60)}`;
    create.mutate(
      { raw_input: text, current_date: `${date}T12:00:00${tz}`, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      {
        onSuccess: () => { setInput(''); setShowAdd(false); },
        onError: () => { /* TaskCard / toast handles */ },
      }
    );
  }

  return (
    <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
      <div className="flex items-center gap-2 px-1 mb-3">
        <CalendarDays size={14} className="text-primary" />
        <span className="text-sm font-bold text-slate-900 dark:text-white">{formatDate(date)}</span>
        <span className="text-xs text-slate-400 ml-auto">{dayTasks.length} task{dayTasks.length !== 1 ? 's' : ''}</span>
        <button
          onClick={() => { setShowAdd((v) => !v); setTimeout(() => inputRef.current?.focus(), 60); }}
          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-primary transition-colors"
          title={`Add task for ${formatDate(date)}`}
        >
          <Plus size={16} />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="flex gap-2 mb-3">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What do you need to do?"
            disabled={create.isPending}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <button
            type="submit"
            disabled={!input.trim() || create.isPending}
            className="px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold disabled:opacity-40 flex items-center gap-1"
          >
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </form>
      )}

      {dayTasks.length === 0
        ? <p className="text-sm text-slate-400 pb-4">No tasks scheduled for this day</p>
        : <div className="space-y-2">{dayTasks.map((t) => <TaskCard key={t.id} task={t} />)}</div>
      }
    </div>
  );
}
