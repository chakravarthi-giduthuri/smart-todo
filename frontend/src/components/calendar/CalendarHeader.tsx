import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarView } from '@/hooks/useCalendar';

interface Props {
  view: CalendarView; onViewChange: (v: CalendarView) => void;
  displayMonth: { year: number; month: number }; onPrev: () => void; onNext: () => void;
  onToday: () => void;
}
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function CalendarHeader({ view, onViewChange, displayMonth, onPrev, onNext, onToday }: Props) {
  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {MONTHS[displayMonth.month]} {displayMonth.year}
        </h1>
        <div className="flex items-center gap-1">
          <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer">
            <ChevronLeft size={18} />
          </button>
          <button onClick={onNext} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer">
            <ChevronRight size={18} />
          </button>
        </div>
        <button onClick={onToday} className="px-3 py-1 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
          Today
        </button>
      </div>
      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
        {(['month','week'] as CalendarView[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all cursor-pointer ${
              v === view
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}
