import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarView } from '@/hooks/useCalendar';

interface Props {
  view: CalendarView; onViewChange: (v: CalendarView) => void;
  displayMonth: { year: number; month: number }; onPrev: () => void; onNext: () => void;
}
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export function CalendarHeader({ view, onViewChange, displayMonth, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
      <button onClick={onPrev} className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer active:scale-90">
        <ChevronLeft size={18} />
      </button>
      <div className="flex flex-col items-center gap-2">
        <span className="text-base font-bold text-white">{MONTHS[displayMonth.month]} {displayMonth.year}</span>
        <div className="flex glass rounded-xl p-0.5 gap-0.5">
          {(['month','week'] as CalendarView[]).map((v) => (
            <button key={v} onClick={() => onViewChange(v)}
              className={`px-4 py-1 rounded-lg text-xs font-semibold capitalize transition-all duration-200 cursor-pointer ${v === view ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'text-white/40 hover:text-white'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onNext} className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-colors cursor-pointer active:scale-90">
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
