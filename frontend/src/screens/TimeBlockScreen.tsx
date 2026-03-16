import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useTasks, useScheduleTask } from '../hooks/useTasks';
import { CATEGORY_COLORS } from '../constants/categories';
import { localDateStr, formatTime } from '../utils/dateFormat';
import type { Task, Category } from '../types/task';

const START_HOUR = 6;   // 6 AM
const END_HOUR = 22;    // 10 PM
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 960
const PX_PER_MIN = 2;   // 2px per minute → 1920px total
const HOUR_PX = 60 * PX_PER_MIN; // 120px per hour
const LABEL_W = 56;     // px for time label column

function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return localDateStr(d);
}

function minutesSinceMidnight(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

function snapToFive(mins: number): number {
  return Math.round(mins / 5) * 5;
}

function clamp(val: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, val));
}

function friendlyDate(dateStr: string): string {
  const today = localDateStr();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  if (dateStr === yesterday) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

interface DragState {
  taskId: string;
  startY: number;
  origMins: number;
  ghostMins: number;
}

export function TimeBlockScreen() {
  const [selectedDate, setSelectedDate] = useState(localDateStr());
  const [drag, setDrag] = useState<DragState | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const { data: allTasks = [] } = useTasks();
  const { mutate: scheduleTask } = useScheduleTask();

  // Filter tasks for selected date
  const dayTasks = allTasks.filter(
    (t) => !t.is_completed && !t.is_archived && t.scheduled_date === selectedDate
  );
  const scheduledTasks = dayTasks.filter((t) => t.scheduled_time !== null);
  const unscheduledTasks = dayTasks.filter((t) => t.scheduled_time === null);

  // Current time in minutes since midnight
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nowIsVisible = nowMins >= START_HOUR * 60 && nowMins <= END_HOUR * 60;
  const nowTop = (nowMins - START_HOUR * 60) * PX_PER_MIN;

  // Auto-scroll to current time on mount / date change
  useEffect(() => {
    if (selectedDate !== localDateStr()) return;
    if (!timelineRef.current || !nowIsVisible) return;
    const scrollTarget = nowTop - 120;
    timelineRef.current.scrollTop = Math.max(0, scrollTarget);
  }, [selectedDate, nowTop, nowIsVisible]);

  // Get Y position relative to the timeline container
  const getTimelineY = useCallback((clientY: number): number => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    return clientY - rect.top + timelineRef.current.scrollTop;
  }, []);

  // Convert Y position to minutes since midnight (clamped to timeline bounds)
  const yToMins = useCallback((y: number): number => {
    const rawMins = Math.round(y / PX_PER_MIN) + START_HOUR * 60;
    return clamp(snapToFive(rawMins), START_HOUR * 60, END_HOUR * 60 - 15);
  }, []);

  // ---- Drag handlers for scheduled blocks ----
  function handleDragStart(e: React.DragEvent, task: Task) {
    if (!task.scheduled_time) return;
    const origMins = minutesSinceMidnight(task.scheduled_time);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    setDrag({ taskId: task.id, startY: getTimelineY(e.clientY), origMins, ghostMins: origMins });
  }

  function handleTimelineDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!drag) return;
    const y = getTimelineY(e.clientY);
    const delta = y - drag.startY;
    const newMins = clamp(snapToFive(drag.origMins + Math.round(delta / PX_PER_MIN)), START_HOUR * 60, END_HOUR * 60 - 15);
    setDrag((d) => d ? { ...d, ghostMins: newMins } : null);
  }

  function handleTimelineDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!drag) return;
    const y = getTimelineY(e.clientY);
    const delta = y - drag.startY;
    const newMins = clamp(snapToFive(drag.origMins + Math.round(delta / PX_PER_MIN)), START_HOUR * 60, END_HOUR * 60 - 15);
    scheduleTask({ id: drag.taskId, scheduled_date: selectedDate, scheduled_time: minutesToTimeStr(newMins) });
    setDrag(null);
  }

  // ---- Drag from unscheduled panel ----
  function handleUnscheduledDragStart(e: React.DragEvent, task: Task) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    setDrag({ taskId: task.id, startY: -1, origMins: -1, ghostMins: -1 });
  }

  function handleUnscheduledDrop(e: React.DragEvent) {
    e.preventDefault();
    if (!drag) return;
    // Drop back onto unscheduled area → no-op
    setDrag(null);
  }

  function handleTimelineDropFromUnscheduled(e: React.DragEvent) {
    e.preventDefault();
    if (!drag || drag.origMins !== -1) return;
    const y = getTimelineY(e.clientY);
    const newMins = clamp(snapToFive(Math.round(y / PX_PER_MIN) + START_HOUR * 60), START_HOUR * 60, END_HOUR * 60 - 15);
    scheduleTask({ id: drag.taskId, scheduled_date: selectedDate, scheduled_time: minutesToTimeStr(newMins) });
    setDrag(null);
  }

  function handleDropOnTimeline(e: React.DragEvent) {
    if (drag?.origMins === -1) {
      handleTimelineDropFromUnscheduled(e);
    } else {
      handleTimelineDrop(e);
    }
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--app-bg)' }}>
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18181b]">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Timeline</h1>
          </div>
          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setSelectedDate(localDateStr())}
              className="px-3 py-1 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-w-[80px] text-center"
            >
              {friendlyDate(selectedDate)}
            </button>
            <button
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable timeline */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-2xl mx-auto w-full">
        <div
          ref={timelineRef}
          className="flex-1 overflow-y-auto relative"
          onDragOver={handleTimelineDragOver}
          onDrop={handleDropOnTimeline}
          onDragLeave={() => {}}
        >
          {/* Timeline content — fixed height */}
          <div
            className="relative"
            style={{ height: `${TOTAL_MINUTES * PX_PER_MIN}px`, minWidth: 0 }}
          >
            {/* Hour labels + grid lines */}
            {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
              const hour = START_HOUR + i;
              const top = i * HOUR_PX;
              const label = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
              return (
                <div key={hour} className="absolute left-0 right-0" style={{ top }}>
                  <div className="flex items-center" style={{ height: 0 }}>
                    <span
                      className="text-[10px] font-medium text-slate-400 dark:text-slate-600 shrink-0 text-right pr-2"
                      style={{ width: LABEL_W }}
                    >
                      {label}
                    </span>
                    <div className="flex-1 border-t border-dashed border-slate-200 dark:border-slate-800" />
                  </div>
                </div>
              );
            })}

            {/* Current time indicator */}
            {selectedDate === localDateStr() && nowIsVisible && (
              <div
                className="absolute right-0 flex items-center pointer-events-none z-10"
                style={{ top: nowTop, left: 0 }}
              >
                <div style={{ width: LABEL_W }} className="flex justify-end pr-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
                <div className="flex-1 border-t-2 border-red-500" />
              </div>
            )}

            {/* Task blocks */}
            {scheduledTasks.map((task) => {
              const timeMins = minutesSinceMidnight(task.scheduled_time!);
              const topMins = timeMins - START_HOUR * 60;
              const heightMins = task.duration_minutes ?? 60;
              const isBeingDragged = drag?.taskId === task.id;
              const displayTop = isBeingDragged && drag?.ghostMins !== undefined && drag.ghostMins >= 0
                ? (drag.ghostMins - START_HOUR * 60) * PX_PER_MIN
                : topMins * PX_PER_MIN;
              const catColor = CATEGORY_COLORS[task.category as Category];

              if (topMins < 0 || topMins > TOTAL_MINUTES) return null;

              return (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={() => setDrag(null)}
                  className={`absolute rounded-lg px-2 py-1 text-xs font-bold cursor-grab active:cursor-grabbing select-none transition-opacity ${isBeingDragged ? 'opacity-60' : 'opacity-100'}`}
                  style={{
                    top: displayTop,
                    left: LABEL_W + 4,
                    right: 8,
                    height: Math.max(heightMins * PX_PER_MIN, 24),
                    backgroundColor: `${catColor}26`,
                    border: `1.5px solid ${catColor}`,
                    color: catColor,
                    zIndex: isBeingDragged ? 20 : 1,
                  }}
                >
                  <div className="truncate leading-tight">{task.title}</div>
                  <div className="opacity-70 font-normal text-[10px] mt-0.5">
                    {formatTime(task.scheduled_time)}
                    {task.duration_minutes ? ` · ${task.duration_minutes}m` : ''}
                  </div>
                </div>
              );
            })}

            {/* Ghost drop indicator when dragging from unscheduled */}
            {drag && drag.origMins === -1 && drag.ghostMins >= 0 && (
              <div
                className="absolute rounded-lg border-2 border-dashed border-primary/60 bg-primary/10 pointer-events-none"
                style={{
                  top: (drag.ghostMins - START_HOUR * 60) * PX_PER_MIN,
                  left: LABEL_W + 4,
                  right: 8,
                  height: 60 * PX_PER_MIN,
                  zIndex: 20,
                }}
              />
            )}
          </div>
        </div>

        {/* Unscheduled tasks panel */}
        {unscheduledTasks.length > 0 && (
          <div
            className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#18181b] px-4 py-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleUnscheduledDrop}
          >
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Unscheduled — drag to timeline
            </p>
            <div className="flex flex-wrap gap-2">
              {unscheduledTasks.map((task) => {
                const catColor = CATEGORY_COLORS[task.category as Category];
                const isBeingDragged = drag?.taskId === task.id;
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleUnscheduledDragStart(e, task)}
                    onDragEnd={() => setDrag(null)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-grab active:cursor-grabbing select-none transition-opacity ${isBeingDragged ? 'opacity-40' : 'opacity-100'}`}
                    style={{
                      backgroundColor: `${catColor}20`,
                      border: `1.5px solid ${catColor}55`,
                      color: catColor,
                    }}
                  >
                    {task.title}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {dayTasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <Clock size={32} className="text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No tasks scheduled for this day.</p>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Add tasks from the home screen.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
