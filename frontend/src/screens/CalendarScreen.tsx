import { CalendarHeader } from '../components/calendar/CalendarHeader';
import { MonthGrid } from '../components/calendar/MonthGrid';
import { WeekStrip } from '../components/calendar/WeekStrip';
import { DayTaskList } from '../components/calendar/DayTaskList';
import { useCalendar } from '../hooks/useCalendar';
import { useTasks } from '../hooks/useTasks';
import { CalendarDays, Plus } from 'lucide-react';
import { formatDate } from '../utils/dateFormat';

function formatTodayShort() {
  return new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function CalendarScreen() {
  const { data: tasks = [] } = useTasks();
  const { view, setView, selectedDate, setSelectedDate, displayMonth, prevMonth, nextMonth, goToToday } = useCalendar();

  // Get today + tomorrow tasks for right panel
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.scheduled_date === today && !t.is_completed);
  const tomorrowTasks = tasks.filter(t => t.scheduled_date === tomorrow && !t.is_completed);

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--app-bg)' }}>
      {/* Header */}
      <CalendarHeader
        view={view}
        onViewChange={setView}
        displayMonth={displayMonth}
        onPrev={prevMonth}
        onNext={nextMonth}
        onToday={goToToday}
      />

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main calendar area */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {view === 'month'
              ? <MonthGrid year={displayMonth.year} month={displayMonth.month} tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
              : <WeekStrip tasks={tasks} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            }
          </div>

          {/* Selected day tasks */}
          <div className="mt-4">
            <DayTaskList date={selectedDate} tasks={tasks} />
          </div>
        </main>

        {/* Right panel — desktop */}
        <aside className="hidden lg:block w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Upcoming Tasks</h2>
          </div>

          {/* Today */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today</h3>
              {todayTasks.length > 0 && (
                <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">
                  {todayTasks.length}
                </span>
              )}
            </div>
            {todayTasks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">All done for today!</p>
            ) : (
              <div className="space-y-3">
                {todayTasks.slice(0, 5).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedDate(t.scheduled_date!)}
                    className="flex items-start gap-3 group w-full text-left"
                  >
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate">{t.title}</p>
                      {t.scheduled_time && <p className="text-xs text-slate-400">{t.scheduled_time.slice(0,5)}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tomorrow */}
          {tomorrowTasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Tomorrow</h3>
              </div>
              <div className="space-y-3">
                {tomorrowTasks.slice(0, 4).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedDate(t.scheduled_date!)}
                    className="flex items-start gap-3 group w-full text-left"
                  >
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate">{t.title}</p>
                      {t.scheduled_time && <p className="text-xs text-slate-400">{t.scheduled_time.slice(0,5)}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected date info */}
          {selectedDate !== today && selectedDate !== tomorrow && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                {formatDate(selectedDate)}
              </h3>
              <p className="text-xs text-slate-400 italic">
                {tasks.filter(t => t.scheduled_date === selectedDate).length} tasks scheduled
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
