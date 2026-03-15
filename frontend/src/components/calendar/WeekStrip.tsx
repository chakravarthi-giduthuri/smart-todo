import type { Task } from '@/types/task';
import { CATEGORY_COLORS } from '@/constants/categories';
import { localDateStr } from '@/utils/dateFormat';

interface Props { tasks: Task[]; selectedDate: string; onSelectDate: (d: string) => void; }
const DAYS = ['S','M','T','W','T','F','S'];

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
    <div className="flex px-3 py-3 gap-1">
      {days.map((d, i) => {
        const dateStr = localDateStr(d);
        const dayTasks = tasksByDate.get(dateStr) ?? [];
        const isSelected = dateStr === selectedDate;
        const isToday = dateStr === todayStr;
        return (
          <button key={i} onClick={() => onSelectDate(dateStr)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${isSelected ? 'bg-indigo-500/15' : 'hover:bg-white/5'}`}>
            <span className={`text-[10px] font-bold tracking-wide ${isToday ? 'text-indigo-400' : 'text-white/25'}`}>{DAYS[i]}</span>
            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${isSelected ? 'bg-indigo-500 text-white' : isToday ? 'text-indigo-400' : 'text-white/70'}`}>{d.getDate()}</span>
            <div className="flex flex-col gap-0.5">
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
