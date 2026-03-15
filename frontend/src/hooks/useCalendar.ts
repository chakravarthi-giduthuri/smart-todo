import { useState } from 'react';
import { localDateStr } from '../utils/dateFormat';

export type CalendarView = 'month' | 'week';

export function useCalendar() {
  const [view, setView] = useState<CalendarView>('month');
  const [selectedDate, setSelectedDate] = useState<string>(() => localDateStr());
  const [displayMonth, setDisplayMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  function prevMonth() {
    setDisplayMonth((prev) => {
      const d = new Date(prev.year, prev.month - 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function nextMonth() {
    setDisplayMonth((prev) => {
      const d = new Date(prev.year, prev.month + 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  return { view, setView, selectedDate, setSelectedDate, displayMonth, prevMonth, nextMonth };
}
