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
    <div className="bg-white dark:bg-slate-900 overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="py-3 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7" style={{ minHeight: '420px' }}>
        {cells.map((day, i) => {
          if (!day) return (
            <div key={i} className="border-b border-r border-slate-100 dark:border-slate-800 p-2 opacity-30" />
          );
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const dayTasks = tasksByDate.get(dateStr) ?? [];
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isLastCol = (i + 1) % 7 === 0;
          const isLastRow = i >= cells.length - 7;

          return (
            <button
              key={i}
              onClick={() => onSelectDate(dateStr)}
              className={`p-2 text-left transition-all duration-150 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                !isLastCol ? 'border-r border-slate-100 dark:border-slate-800' : ''
              } ${
                !isLastRow ? 'border-b border-slate-100 dark:border-slate-800' : ''
              } ${
                isSelected ? 'bg-primary/5 dark:bg-primary/10' : ''
              } ${
                isToday ? 'bg-primary/5 dark:bg-primary/10' : ''
              }`}
            >
              <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mb-1 ${
                isSelected
                  ? 'bg-primary text-white'
                  : isToday
                  ? 'text-primary font-bold'
                  : 'text-slate-700 dark:text-slate-300'
              }`}>
                {day}
              </span>
              <div className="space-y-0.5">
                {dayTasks.slice(0, 2).map((t, j) => (
                  <div
                    key={j}
                    className="px-1.5 py-0.5 text-[10px] font-bold rounded truncate"
                    style={{
                      backgroundColor: `${CATEGORY_COLORS[t.category]}22`,
                      color: CATEGORY_COLORS[t.category],
                    }}
                  >
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="px-1.5 py-0.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    +{dayTasks.length - 2} more
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
