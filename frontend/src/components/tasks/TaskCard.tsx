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
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-blue-400',
  5: 'bg-slate-500',
};

const PRIORITY_BADGE_COLOR: Record<Priority, string> = {
  1: 'rgba(239,68,68,0.15)',
  2: 'rgba(251,146,60,0.15)',
  3: 'rgba(250,204,21,0.12)',
  4: 'rgba(96,165,250,0.15)',
  5: 'rgba(100,116,139,0.12)',
};

interface Props { task: Task; delay?: number; priorityColor?: string; }

export function TaskCard({ task, delay = 0 }: Props) {
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
  const badgeBg  = PRIORITY_BADGE_COLOR[task.priority as Priority];

  const showBar  = !task.is_completed && deadline.progressPercent !== null;
  const barPulseClass =
    deadline.status === 'overdue'  ? 'deadline-bar-overdue'  :
    deadline.status === 'critical' ? 'deadline-bar-critical' : '';

  return (
    <>
      <div
        className="mx-4 mb-2 animate-slide-up"
        style={{ animationDelay: `${delay}ms` }}
      >
        {/* Card — exact mockup style: neutral dark, clean border */}
        <div
          className={`rounded-2xl overflow-hidden transition-all duration-200 active:scale-[0.99] ${task.is_completed ? 'opacity-55' : ''}`}
          style={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          <div className="flex items-start gap-3 px-4 pt-4 pb-3">

            {/* LEFT — completion circle */}
            <CompletionToggle
              checked={task.is_completed}
              onChange={() => !task.is_completed && complete(task.id)}
            />

            {/* CENTER — content */}
            <div className="flex-1 min-w-0">

              {/* Title row */}
              <button
                onClick={() => !task.is_completed && setActiveField('title')}
                className={`flex items-start gap-1.5 text-left w-full group ${task.is_completed ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <span className={`text-[15px] font-semibold leading-snug ${task.is_completed ? 'line-through text-white/30' : 'text-white'}`}>
                  {task.title}
                </span>
                {!task.is_completed && (
                  <Pencil size={11} className="text-white/15 group-hover:text-[#ec5b13]/60 transition-colors mt-1 shrink-0" />
                )}
              </button>

              {/* Meta row: category + date + time + duration */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-2">

                {/* Category pill */}
                <button
                  onClick={() => setActiveField('category')}
                  className="flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all active:scale-95"
                  style={{ backgroundColor: `${catColor}22`, color: catColor }}
                >
                  {task.category}
                </button>

                {/* Date + time */}
                {task.scheduled_date ? (
                  <button
                    onClick={() => setActiveField('scheduled_date')}
                    className="flex items-center gap-1 text-xs text-white/40 hover:text-white/65 transition-colors cursor-pointer"
                  >
                    <Calendar size={11} className="shrink-0" />
                    <span>{formatDate(task.scheduled_date)}</span>
                    {task.scheduled_time && (
                      <>
                        <Clock size={11} className="ml-1 shrink-0" />
                        <span>{formatTime(task.scheduled_time)}</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveField('scheduled_date')}
                    className="flex items-center gap-1 text-xs text-white/20 hover:text-[#ec5b13]/60 transition-colors cursor-pointer"
                  >
                    <Plus size={11} />
                    <span>Add date</span>
                  </button>
                )}

                {/* Duration */}
                {task.duration_minutes ? (
                  <span className="flex items-center gap-1 text-xs text-white/35">
                    <Timer size={11} className="shrink-0" />
                    {formatDuration(task.duration_minutes)}
                  </span>
                ) : null}
              </div>

              {/* Tags row */}
              {(task.context_tags?.length > 0 || task.recurrence || task.note || !task.is_completed) && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                  {task.context_tags?.map((tag) => (
                    <span key={tag} className="text-[11px] font-medium text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                  {task.recurrence && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-[#ec5b13]/60 bg-[#ec5b13]/8 px-2 py-0.5 rounded-full">
                      <Repeat2 size={9} />
                      {task.recurrence}
                    </span>
                  )}
                  {task.note && (
                    <button
                      onClick={() => setShowNote((v) => !v)}
                      className="flex items-center gap-1 text-[11px] font-medium text-amber-400/55 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      <StickyNote size={9} />
                      <span>note</span>
                    </button>
                  )}
                  {!task.is_completed && (
                    <button
                      onClick={() => setShowSubtasks((v) => !v)}
                      className="flex items-center gap-1 text-[11px] font-medium text-white/25 hover:text-white/55 transition-colors cursor-pointer"
                    >
                      <ChevronDown size={10} className={`transition-transform ${showSubtasks ? 'rotate-180' : ''}`} />
                      <span>subtasks</span>
                    </button>
                  )}
                </div>
              )}

              {/* Override indicator */}
              {task._hasOverride && (
                <div className="flex items-center gap-1 mt-2">
                  <PenLine size={10} className="text-[#ec5b13]/50" />
                  <span className="text-[10px] text-[#ec5b13]/50 font-medium">Edited by you</span>
                </div>
              )}

              {/* Note content */}
              {showNote && task.note && (
                <div className="mt-2 flex items-start gap-1.5 animate-fade-in">
                  <StickyNote size={10} className="text-amber-400/55 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400/65 leading-relaxed">{task.note}</p>
                </div>
              )}

              {/* Subtasks */}
              {showSubtasks && !task.is_completed && (
                <SubtaskList taskId={task.id} />
              )}
            </div>

            {/* RIGHT — priority + actions */}
            <div className="flex flex-col items-center gap-2 shrink-0">

              {/* Priority badge */}
              <button
                onClick={() => setActiveField('priority')}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition-all active:scale-90"
                style={{ background: badgeBg }}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                <span className="text-xs font-bold text-white/70">{task.priority}</span>
              </button>

              {/* AI reschedule — overdue only */}
              {!task.is_completed && task.scheduled_date && task.scheduled_date < new Date().toISOString().split('T')[0] && (
                <button
                  onClick={() => reschedule(task.id)}
                  disabled={isRescheduling}
                  title="AI reschedule"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/20 hover:text-sky-400 hover:bg-sky-500/10 transition-all cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw size={12} className={isRescheduling ? 'animate-spin' : ''} />
                </button>
              )}

              {/* Share */}
              <button
                onClick={handleShare}
                disabled={isSharing}
                title={shareLink ? 'Link copied!' : 'Share task'}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                  shareLink
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-white/20 hover:text-[#ec5b13] hover:bg-[#ec5b13]/10'
                }`}
              >
                {shareLink ? <Link2 size={13} /> : <Share2 size={13} />}
              </button>

              {/* Delete */}
              {confirmDelete ? (
                <button
                  onClick={() => remove(task.id)}
                  className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-bold active:scale-90 transition-all cursor-pointer animate-fade-in"
                >
                  <Trash2 size={10} />
                </button>
              ) : (
                <button
                  onClick={() => { setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000); }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/20 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Deadline progress bar */}
          {showBar && (
            <div className="px-4 pb-3 -mt-1">
              <div className="relative h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-[60000ms] ease-linear ${barPulseClass}`}
                  style={{
                    width: `${deadline.progressPercent}%`,
                    background:
                      deadline.status === 'overdue'  ? '#ef4444' :
                      deadline.status === 'critical' ? 'linear-gradient(90deg, #ec5b13, #ef4444)' :
                      deadline.status === 'soon'     ? 'linear-gradient(90deg, #ec5b13, #eab308)' :
                                                       'linear-gradient(90deg, #ec5b13, #f97316)',
                    boxShadow:
                      deadline.status === 'overdue'  ? '0 0 6px rgba(239,68,68,0.7)'  :
                      deadline.status === 'critical' ? '0 0 6px rgba(236,91,19,0.6)'  : 'none',
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
