import { useState } from 'react';

export type CalendarView = 'month' | 'week';

/** Returns "YYYY-MM-DD" in the device's LOCAL timezone (never UTC). */
function localDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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

  function goToToday() {
    const now = new Date();
    setSelectedDate(localDateStr(now));
    setDisplayMonth({ year: now.getFullYear(), month: now.getMonth() });
  }

  return { view, setView, selectedDate, setSelectedDate, displayMonth, prevMonth, nextMonth, goToToday };
}
