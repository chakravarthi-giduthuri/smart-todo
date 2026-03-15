import { useState } from 'react';
import { Calendar, Clock, Timer, PenLine, Plus, Pencil, Trash2, Repeat2, ChevronDown, RefreshCw, Share2, Link2, StickyNote } from 'lucide-react';
import type { Task, Priority, Category } from '../../types/task';
import { CompletionToggle } from './CompletionToggle';
import { OverrideDrawer, type OverrideField } from './OverrideDrawer';
import { SubtaskList } from './SubtaskList';
import { useCompleteTask, useDeleteTask, useRescheduleTask } from '../../hooks/useTasks';
import { createShare } from '../../api/shares';
import { useDeadlineStatus } from '../../hooks/useDeadlineStatus';
import { CATEGORY_COLORS } from '../../constants/categories';
import { formatDate, formatTime, formatDuration } from '../../utils/dateFormat';

const PRIORITY_DOT: Record<Priority, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-blue-500',
  5: 'bg-gray-500',
};

const PILL_STYLE = {
  overdue:  { bg: 'rgba(239,68,68,0.15)',   text: '#f87171' },
  critical: { bg: 'rgba(249,115,22,0.15)',  text: '#fb923c' },
  soon:     { bg: 'rgba(234,179,8,0.12)',   text: '#facc15' },
  today:    { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8' },
  future:   { bg: 'rgba(255,255,255,0.06)', text: 'rgba(255,255,255,0.4)' },
  none:     { bg: 'transparent', text: 'transparent' },
};

interface Props { task: Task; delay?: number; priorityColor?: string; }

export function TaskCard({ task, delay = 0, priorityColor }: Props) {
  const [activeField, setActiveField] = useState<OverrideField>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { mutate: complete } = useCompleteTask();
  const { mutate: remove } = useDeleteTask();
  const { mutate: reschedule, isPending: isRescheduling } = useRescheduleTask();

  async function handleShare() {
    if (shareLink) { await navigator.clipboard.writeText(shareLink); return; }
    setIsSharing(true);
    try {
      const share = await createShare(task.id);
      const link = `${window.location.origin}/share/${share.token}`;
      setShareLink(link);
      await navigator.clipboard.writeText(link);
    } catch { /* ignore */ } finally { setIsSharing(false); }
  }
  const deadline = useDeadlineStatus(task);

  const catColor = CATEGORY_COLORS[task.category as Category];
  const dotColor = PRIORITY_DOT[task.priority as Priority];
  const borderColor = priorityColor ?? catColor;
  const pill = PILL_STYLE[deadline.status];
  const showBar = !task.is_completed && deadline.progressPercent !== null;
  const showPill = !task.is_completed && deadline.label !== null;

  const barPulseClass =
    deadline.status === 'overdue'  ? 'deadline-bar-overdue'  :
    deadline.status === 'critical' ? 'deadline-bar-critical' : '';

  // Subtle priority-colored card tint (only for incomplete high-urgency tasks)
  const cardTint = !task.is_completed && priorityColor && task.priority <= 2
    ? `rgba(${task.priority === 1 ? '239,68,68' : '249,115,22'},0.04)`
    : 'transparent';

  return (
    <>
      <div
        className="mx-4 mb-3 animate-slide-up"
        style={{ animationDelay: `${delay}ms` }}
      >
        <div
          className={`relative rounded-2xl glass overflow-hidden transition-all duration-300 hover:bg-white/[0.06] active:scale-[0.98] ${task.is_completed ? 'opacity-40' : ''}`}
          style={{ backgroundColor: cardTint }}
        >
          {/* Priority accent line */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-r-full" style={{ backgroundColor: borderColor }} />

          <div className="pl-4 pr-4 pt-4 pb-3">
            <div className="flex items-start gap-3">
              <CompletionToggle checked={task.is_completed} onChange={() => !task.is_completed && complete(task.id)} />

              <div className="flex-1 min-w-0">
                {/* Title */}
                <button
                  onClick={() => !task.is_completed && setActiveField('title')}
                  className={`group flex items-start gap-1.5 text-left w-full ${task.is_completed ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className={`text-[15px] font-semibold leading-snug ${task.is_completed ? 'line-through text-white/30' : 'text-white'}`}>
                    {task.title}
                  </span>
                  {!task.is_completed && (
                    <Pencil size={11} className="text-white/20 group-hover:text-indigo-400/70 transition-colors mt-1 shrink-0" />
                  )}
                </button>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2">
                  {/* Category chip */}
                  <button onClick={() => setActiveField('category')}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer"
                    style={{ backgroundColor: `${catColor}20`, color: catColor }}>
                    {task.category}
                  </button>

                  {/* Date/time */}
                  {task.scheduled_date ? (
                    <button onClick={() => setActiveField('scheduled_date')}
                      className="flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer">
                      <Calendar size={11} />
                      <span>{formatDate(task.scheduled_date)}</span>
                      {task.scheduled_time && (
                        <>
                          <Clock size={11} className="ml-0.5" />
                          <span>{formatTime(task.scheduled_time)}</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button onClick={() => setActiveField('scheduled_date')}
                      className="flex items-center gap-1 text-xs text-white/20 hover:text-indigo-400/60 transition-colors cursor-pointer">
                      <Plus size={11} />
                      <span>Add date</span>
                    </button>
                  )}

                  {/* Duration */}
                  {task.duration_minutes && (
                    <span className="flex items-center gap-1 text-xs text-white/30">
                      <Timer size={11} />
                      {formatDuration(task.duration_minutes)}
                    </span>
                  )}

                  {/* Context tags */}
                  {task.context_tags?.length > 0 && task.context_tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-semibold text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}

                  {/* Recurrence badge */}
                  {task.recurrence && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-400/70 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                      <Repeat2 size={9} />
                      {task.recurrence}
                    </span>
                  )}

                  {/* Note indicator */}
                  {task.note && (
                    <button
                      onClick={() => setShowNote((v) => !v)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-amber-400/60 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <StickyNote size={9} />
                      <span>note</span>
                    </button>
                  )}

                  {/* Subtasks toggle */}
                  {!task.is_completed && (
                    <button
                      onClick={() => setShowSubtasks((v) => !v)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-white/25 hover:text-white/60 transition-colors cursor-pointer"
                    >
                      <ChevronDown size={10} className={`transition-transform ${showSubtasks ? 'rotate-180' : ''}`} />
                      <span>subtasks</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Right column: priority + deadline pill + delete */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <button onClick={() => setActiveField('priority')}
                  className="flex items-center gap-1.5 glass rounded-xl px-2.5 py-1.5 transition-all duration-200 active:scale-90 cursor-pointer group">
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                  <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">{task.priority}</span>
                </button>

                {showPill && (
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: pill.bg, color: pill.text }}
                  >
                    <span>{deadline.label}</span>
                  </div>
                )}

                {/* Reschedule (overdue only) */}
                {!task.is_completed && task.scheduled_date && task.scheduled_date < new Date().toISOString().split('T')[0] && (
                  <button
                    onClick={() => reschedule(task.id)}
                    disabled={isRescheduling}
                    title="AI reschedule"
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-white/15 hover:text-sky-400 hover:bg-sky-500/10 transition-all duration-200 cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw size={11} className={isRescheduling ? 'animate-spin' : ''} />
                  </button>
                )}

                {/* Share */}
                <button
                  onClick={handleShare}
                  disabled={isSharing}
                  title={shareLink ? 'Link copied!' : 'Share task'}
                  className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer ${shareLink ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/15 hover:text-indigo-400 hover:bg-indigo-500/10'}`}
                >
                  {shareLink ? <Link2 size={11} /> : <Share2 size={11} />}
                </button>

                {/* Delete */}
                {confirmDelete ? (
                  <button
                    onClick={() => remove(task.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-xl bg-red-500/20 text-red-400 text-[10px] font-bold active:scale-90 transition-all duration-150 cursor-pointer animate-fade-in"
                  >
                    <Trash2 size={10} />
                    <span>Delete?</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-white/15 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Override indicator */}
            {task._hasOverride && (
              <div className="flex items-center gap-1 mt-2 pl-9">
                <PenLine size={10} className="text-indigo-400/60" />
                <span className="text-[10px] text-indigo-400/60 font-medium">Edited</span>
              </div>
            )}

            {/* Note display */}
            {showNote && task.note && (
              <div className="mt-2 pl-9 flex items-start gap-1.5 animate-fade-in">
                <StickyNote size={10} className="text-amber-400/60 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-400/70 leading-relaxed">{task.note}</p>
              </div>
            )}

            {/* Subtasks section */}
            {showSubtasks && !task.is_completed && (
              <SubtaskList taskId={task.id} />
            )}
          </div>

          {/* Deadline progress bar */}
          {showBar && (
            <div className="px-4 pb-3">
              {/* Track */}
              <div className="relative h-[3px] rounded-full bg-white/5 overflow-hidden">
                {/* Fill */}
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-[60000ms] ease-linear ${barPulseClass}`}
                  style={{
                    width: `${deadline.progressPercent}%`,
                    background: deadline.status === 'overdue'
                      ? '#ef4444'
                      : deadline.status === 'critical'
                      ? 'linear-gradient(90deg, #f97316, #ef4444)'
                      : deadline.status === 'soon'
                      ? 'linear-gradient(90deg, #6366f1, #eab308)'
                      : 'linear-gradient(90deg, #6366f1, #818cf8)',
                    boxShadow: deadline.status === 'overdue'  ? '0 0 6px rgba(239,68,68,0.8)'  :
                               deadline.status === 'critical' ? '0 0 6px rgba(249,115,22,0.7)' :
                               deadline.status === 'soon'     ? '0 0 4px rgba(234,179,8,0.5)'  : 'none',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <OverrideDrawer task={task} field={activeField} onClose={() => setActiveField(null)} />
    </>
  );
}
