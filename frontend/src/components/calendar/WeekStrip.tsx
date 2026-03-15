import type { Task } from '@/types/task';
import { CATEGORY_COLORS } from '@/constants/categories';
import { localDateStr } from '@/utils/dateFormat';

interface Props { tasks: Task[]; selectedDate: string; onSelectDate: (d: string) => void; }
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function WeekStrip({ tasks, selectedDate, onSelectDate }: Props) {
  const today = new Date();
  const todayStr = localDateStr(today);
  const start = new Date(today); start.setDate(today.getDate() - today.getDay());
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d;
  });

  const tasksByDate = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.scheduled_date) continue;
    const l = tasksByDate.get(t.scheduled_date) ?? [];
    l.push(t);
    tasksByDate.set(t.scheduled_date, l);
  }

  return (
    <div className="flex px-4 py-4 gap-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      {days.map((d, i) => {
        const dateStr = localDateStr(d);
        const dayTasks = tasksByDate.get(dateStr) ?? [];
        const isSelected = dateStr === selectedDate;
        const isToday = dateStr === todayStr;
        return (
          <button
            key={i}
            onClick={() => onSelectDate(dateStr)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
              isSelected ? 'bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <span className={`text-[11px] font-bold tracking-wide ${isToday ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
              {DAYS[i]}
            </span>
            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
              isSelected ? 'bg-primary text-white' : isToday ? 'text-primary' : 'text-slate-700 dark:text-slate-300'
            }`}>
              {d.getDate()}
            </span>
            <div className="flex gap-0.5">
              {dayTasks.slice(0, 3).map((t, j) => (
                <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[t.category] }} />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}
