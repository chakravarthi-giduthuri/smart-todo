import { useState, useEffect } from 'react';
import type { Task } from '../types/task';

export type DeadlineStatus = 'overdue' | 'critical' | 'soon' | 'today' | 'future' | 'none';

export interface DeadlineInfo {
  status: DeadlineStatus;
  minutesLeft: number | null;
  label: string | null;
  /** 0–100: how much time remains as % of the total window (created → deadline). 0 = overdue. */
  progressPercent: number | null;
  /** CSS color for the bar */
  barColor: string;
}

const BAR_COLORS: Record<DeadlineStatus, string> = {
  overdue:  '#ef4444',
  critical: '#f97316',
  soon:     '#eab308',
  today:    '#6366f1',
  future:   '#6366f1',
  none:     'transparent',
};

function calcStatus(task: Task): DeadlineInfo {
  if (!task.scheduled_date || task.is_completed) {
    return { status: 'none', minutesLeft: null, label: null, progressPercent: null, barColor: 'transparent' };
  }

  const now = new Date();
  const dateStr = task.scheduled_date;
  const timePart = (task.scheduled_time ?? '23:59').slice(0, 5);
  const deadline = new Date(`${dateStr}T${timePart}:00`);

  const diffMs = deadline.getTime() - now.getTime();
  const minutesLeft = Math.floor(diffMs / 60_000);

  // Progress: % of window (created_at → deadline) that is still remaining
  const createdAt = new Date(task.created_at);
  const totalMs = deadline.getTime() - createdAt.getTime();
  const progressPercent = totalMs > 0
    ? Math.max(0, Math.min(100, (diffMs / totalMs) * 100))
    : minutesLeft >= 0 ? 100 : 0;

  let status: DeadlineStatus;
  let label: string;

  if (minutesLeft < 0) {
    const over = Math.abs(minutesLeft);
    label = over < 60 ? `${over}m overdue` : over < 1440 ? `${Math.floor(over / 60)}h overdue` : `${Math.floor(over / 1440)}d overdue`;
    status = 'overdue';
  } else if (minutesLeft <= 30) {
    label = minutesLeft === 0 ? 'Now!' : `${minutesLeft}m left`;
    status = 'critical';
  } else if (minutesLeft <= 120) {
    label = `${minutesLeft}m left`;
    status = 'soon';
  } else {
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    if (dateStr === todayStr) {
      const h = Math.floor(minutesLeft / 60), m = minutesLeft % 60;
      label = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''} left` : `${m}m left`;
      status = 'today';
    } else {
      const days = Math.floor(minutesLeft / 1440);
      label = days === 1 ? 'Tomorrow' : `${days}d left`;
      status = 'future';
    }
  }

  return { status, minutesLeft, label, progressPercent, barColor: BAR_COLORS[status] };
}

export function useDeadlineStatus(task: Task): DeadlineInfo {
  const [info, setInfo] = useState<DeadlineInfo>(() => calcStatus(task));

  useEffect(() => {
    setInfo(calcStatus(task));
    const id = setInterval(() => setInfo(calcStatus(task)), 60_000);
    return () => clearInterval(id);
  }, [task.scheduled_date, task.scheduled_time, task.is_completed, task.created_at]);

  return info;
}
