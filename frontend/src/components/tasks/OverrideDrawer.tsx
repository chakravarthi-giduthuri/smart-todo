import { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';
import type { Task, Priority, Category } from '../../types/task';
import { PriorityPicker } from './PriorityPicker';
import { CategoryPicker } from './CategoryPicker';
import { useOverride } from '../../hooks/useOverride';

export type OverrideField = 'priority' | 'category' | 'scheduled_date' | 'scheduled_time' | 'title' | null;
interface Props { task: Task; field: OverrideField; onClose: () => void; }

const FIELD_LABELS: Record<string, string> = {
  priority: 'Set Priority',
  category: 'Set Category',
  scheduled_date: 'Edit Date & Time',
  scheduled_time: 'Edit Date & Time',
  title: 'Edit Task Name',
};

export function OverrideDrawer({ task, field, onClose }: Props) {
  const { mutate: override } = useOverride();
  const [reason, setReason] = useState('');
  const [visible, setVisible] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (field) {
      setReason('');
      setTitleValue(task.title);
      setDateValue(task.scheduled_date ?? '');
      setTimeValue(task.scheduled_time ?? '');
      setTimeout(() => {
        setVisible(true);
        if (field === 'title') setTimeout(() => titleRef.current?.focus(), 100);
      }, 10);
    } else {
      setVisible(false);
    }
  }, [field]);

  if (!field) return null;

  const keywords = task.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  function applyOverride(fieldName: string, newValue: string) {
    const aiValue = String(task[fieldName as keyof Task] ?? '');
    override({ taskId: task.id, field_changed: fieldName, ai_value: aiValue, user_value: newValue, reason, task_keywords: keywords });
  }

  function handleSaveTitle() {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== task.title) applyOverride('title', trimmed);
    onClose();
  }

  function handleSaveDateTime() {
    if (dateValue !== (task.scheduled_date ?? '')) applyOverride('scheduled_date', dateValue);
    if (timeValue !== (task.scheduled_time ?? '')) applyOverride('scheduled_time', timeValue);
    onClose();
  }

  const isDateTimeField = field === 'scheduled_date' || field === 'scheduled_time';

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end transition-all duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: visible ? 'rgba(0,0,0,0.5)' : 'transparent' }}
      onClick={onClose}
    >
      <div
        className={`w-full glass-strong rounded-t-3xl p-5 pb-safe transition-transform duration-300 ease-out ${visible ? 'translate-y-0' : 'translate-y-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{FIELD_LABELS[field]}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full glass text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer">
            <X size={16} />
          </button>
        </div>

        {field === 'title' && (
          <div className="flex gap-2">
            <input
              ref={titleRef}
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              className="flex-1 glass rounded-2xl px-4 h-12 text-slate-900 dark:text-white text-sm font-medium outline-none focus:border-indigo-500/50 transition-colors"
            />
            <button onClick={handleSaveTitle}
              className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white cursor-pointer active:scale-90 transition-transform shrink-0">
              <Check size={18} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {field === 'priority' && (
          <PriorityPicker value={task.priority} onChange={(p) => { applyOverride('priority', String(p)); onClose(); }} />
        )}

        {field === 'category' && (
          <CategoryPicker value={task.category} onChange={(c) => { applyOverride('category', c); onClose(); }} />
        )}

        {isDateTimeField && (
          <>
            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-white/40 mb-1.5 font-medium">Date</p>
                <input type="date" value={dateValue} onChange={(e) => setDateValue(e.target.value)}
                  className="w-full glass text-slate-900 dark:text-white rounded-xl px-3 h-12 text-sm outline-none focus:border-indigo-500/50 transition-colors cursor-pointer [color-scheme:dark] dark:[color-scheme:dark]" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500 dark:text-white/40 mb-1.5 font-medium">Time</p>
                <input type="time" value={timeValue} onChange={(e) => setTimeValue(e.target.value)}
                  className="w-full glass text-slate-900 dark:text-white rounded-xl px-3 h-12 text-sm outline-none focus:border-indigo-500/50 transition-colors cursor-pointer [color-scheme:dark] dark:[color-scheme:dark]" />
              </div>
            </div>
            <button onClick={handleSaveDateTime}
              className="w-full h-12 rounded-2xl bg-indigo-500 text-white font-semibold text-sm cursor-pointer active:scale-[0.98] transition-transform">
              Save
            </button>
          </>
        )}

        {field !== 'title' && !isDateTimeField && (
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value.slice(0, 80))}
            placeholder="Why? (optional — helps AI learn)"
            className="w-full mt-4 glass rounded-2xl px-4 h-11 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 outline-none focus:border-indigo-500/50 transition-colors" />
        )}
      </div>
    </div>
  );
}
