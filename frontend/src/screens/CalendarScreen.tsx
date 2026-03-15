import { PageShell } from '../components/layout/PageShell';
import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { MonthGrid } from '../components/calendar/MonthGrid';
import { WeekStrip } from '../components/calendar/WeekStrip';
import { DayTaskList } from '../components/calendar/DayTaskList';
import { useCalendar } from '../hooks/useCalendar';
import { useTasks } from '../hooks/useTasks';

export function CalendarScreen() {
  const { data: tasks = [] } = useTasks();
  const { view, setView, selectedDate, setSelectedDate, displayMonth, prevMonth, nextMonth } = useCalendar();
  return (
    <PageShell noPadding className="pt-safe">
      <CalendarHeader view={view} onViewChange={setView} displayMonth={displayMonth} onPrev={prevMonth} onNext={nextMonth} />
      {view === 'month'
        ? <MonthGrid year={displayMonth.year} month={displayMonth.month} tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        : <WeekStrip tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      }
      <DayTaskList date={selectedDate} tasks={tasks} />
    </PageShell>
  );
}
