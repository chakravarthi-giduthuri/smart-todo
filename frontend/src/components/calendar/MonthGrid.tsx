import type { Task } from '@/types/task';
import { CATEGORY_COLORS } from '@/constants/categories';

interface Props { year: number; month: number; tasks: Task[]; selectedDate: string; onSelectDate: (d: string) => void; }

export function MonthGrid({ year, month, tasks, selectedDate, onSelectDate }: Props) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split('T')[0];

  const tasksByDate = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.scheduled_date) continue;
    const list = tasksByDate.get(t.scheduled_date) ?? [];
    list.push(t); tasksByDate.set(t.scheduled_date, list);
  }

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="px-3 pb-2">
      <div className="grid grid-cols-7 text-center py-3">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map((d, i) => (
          <div key={i} className="text-[11px] font-bold text-white/25 tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const dayTasks = tasksByDate.get(dateStr) ?? [];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          return (
            <button key={i} onClick={() => onSelectDate(dateStr)}
              className={`flex flex-col items-center py-1.5 rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 ${isSelected ? 'bg-indigo-500/20' : 'hover:bg-white/5'}`}>
              <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                isSelected ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40' :
                isToday ? 'text-indigo-400' : 'text-white/70'
              }`}>{day}</span>
              <div className="flex gap-0.5 mt-0.5 h-1.5">
                {dayTasks.slice(0,3).map((t, j) => (
                  <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[t.category] }} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
