import { memo, useState, useRef, useEffect } from 'react';
import { Calendar, Clock, Timer, PenLine, Plus, Pencil, Trash2, Repeat2, ChevronDown, RefreshCw, Share2, Link2, StickyNote, Check, X, BellRing, Sparkles } from 'lucide-react';
import type { Task, Priority, Category } from '../../types/task';
import { CompletionToggle } from './CompletionToggle';
import { OverrideDrawer, type OverrideField } from './OverrideDrawer';
import { SubtaskList } from './SubtaskList';
import { FocusTimer } from './FocusTimer';
import { useCompleteTask, useDeleteTask, useRescheduleTask, useUpdateNote, useSetNag } from '../../hooks/useTasks';
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

export const TaskCard = memo(function TaskCard({ task, delay = 0 }: Props) {
  const [activeField, setActiveField] = useState<OverrideField>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [showNote, setShowNote] = useState(!!task.note);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(task.note ?? '');
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const { mutate: complete } = useCompleteTask();
  const { mutate: remove } = useDeleteTask();
  const { mutate: reschedule, isPending: isRescheduling } = useRescheduleTask();
  const { mutate: saveNote, isPending: isSavingNote } = useUpdateNote();
  const [rescheduled, setRescheduled] = useState(false);
  const [showNagPicker, setShowNagPicker] = useState(false);
  const [showFocusTimer, setShowFocusTimer] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const { mutate: setNag } = useSetNag();

  const NAG_OPTIONS: { label: string; value: number | null }[] = [
    { label: 'Every 15 min', value: 15 },
    { label: 'Every 30 min', value: 30 },
    { label: 'Every 1 hour', value: 60 },
    { label: 'Disable', value: null },
  ];

  function handleNagSelect(value: number | null) {
    setNag({ id: task.id, interval_minutes: value });
    setShowNagPicker(false);
  }

  const isOverdueHighPriority = (() => {
    if (task.is_completed || task.priority > 2) return false;
    if (!task.scheduled_date) return false;
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (task.scheduled_date < todayStr) return true;
    if (task.scheduled_date === todayStr && task.scheduled_time) {
      return task.scheduled_time < `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    }
    return false;
  })();

  function handleReschedule() {
    reschedule(task.id, {
      onSuccess: () => { setRescheduled(true); setTimeout(() => setRescheduled(false), 2500); },
    });
  }

  useEffect(() => { if (editingNote) noteRef.current?.focus(); }, [editingNote]);

  function handleNoteSave() {
    saveNote({ id: task.id, note: noteText.trim() }, {
      onSuccess: () => { setEditingNote(false); setShowNote(!!noteText.trim()); },
    });
  }

  function handleNoteCancel() {
    setNoteText(task.note ?? '');
    setEditingNote(false);
  }

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
        className="mb-2 animate-slide-up"
        style={{ animationDelay: `${delay}ms` }}
      >
        {/* Card — white light / dark surface */}
        <div
          className={`group bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/[0.08] rounded-2xl soft-shadow hover:border-blue-100 dark:hover:border-white/[0.15] overflow-hidden transition-all duration-200 active:scale-[0.99] ${task.is_completed ? 'opacity-55' : ''}`}
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
                <span className={`text-[15px] font-semibold leading-snug ${task.is_completed ? 'line-through text-gray-400 dark:text-white/30' : 'text-gray-900 dark:text-white'}`}>
                  {task.title}
                </span>
                {!task.is_completed && (
                  <Pencil size={11} className="text-gray-300 dark:text-white/15 group-hover:text-blue-500/60 transition-colors mt-1 shrink-0" />
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
                    className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/40 hover:text-gray-600 dark:hover:text-white/65 transition-colors cursor-pointer"
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
                    className="flex items-center gap-1 text-xs text-gray-300 dark:text-white/20 hover:text-blue-500/60 transition-colors cursor-pointer"
                  >
                    <Plus size={11} />
                    <span>Add date</span>
                  </button>
                )}

                {/* Duration */}
                {task.duration_minutes ? (
                  <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-white/35">
                    <Timer size={11} className="shrink-0" />
                    {formatDuration(task.duration_minutes)}
                  </span>
                ) : null}
              </div>

              {/* Tags row */}
              {(task.context_tags?.length > 0 || task.recurrence || task.note || !task.is_completed) && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                  {task.context_tags?.map((tag) => (
                    <span key={tag} className="text-[11px] font-medium text-gray-400 dark:text-white/40 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                  {task.recurrence && (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-blue-500/60 bg-blue-500/8 px-2 py-0.5 rounded-full">
                      <Repeat2 size={9} />
                      {task.recurrence}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      if (editingNote) { handleNoteCancel(); return; }
                      setShowNote(true);
                      setEditingNote(true);
                    }}
                    className={`flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      task.note
                        ? 'text-amber-400/70 hover:text-amber-400'
                        : 'text-gray-300 dark:text-white/20 hover:text-amber-400'
                    }`}
                  >
                    <StickyNote size={9} />
                    <span>{task.note ? 'note' : 'add note'}</span>
                  </button>
                  {!task.is_completed && (
                    <button
                      onClick={() => setShowSubtasks((v) => !v)}
                      className="flex items-center gap-1 text-[11px] font-medium text-gray-400 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/55 transition-colors cursor-pointer"
                    >
                      <ChevronDown size={10} className={`transition-transform ${showSubtasks ? 'rotate-180' : ''}`} />
                      <span>subtasks</span>
                    </button>
                  )}
                  {task.ai_reasoning && (
                    <button
                      onClick={() => setShowReasoning((v) => !v)}
                      className={`flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                        showReasoning
                          ? 'text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full'
                          : 'text-gray-300 dark:text-white/20 hover:text-violet-400'
                      }`}
                    >
                      <Sparkles size={9} />
                      <span>Why?</span>
                    </button>
                  )}
                </div>
              )}

              {/* Override indicator */}
              {task._hasOverride && (
                <div className="flex items-center gap-1 mt-2">
                  <PenLine size={10} className="text-blue-500/60" />
                  <span className="text-[10px] text-blue-500/60 font-medium">Edited by you</span>
                </div>
              )}

              {/* AI Reasoning */}
              {showReasoning && task.ai_reasoning && (
                <div className="mt-2 flex items-start gap-1.5 animate-fade-in">
                  <Sparkles size={10} className="text-violet-400/70 mt-0.5 shrink-0" />
                  <p className="text-xs text-violet-400/75 leading-relaxed">{task.ai_reasoning}</p>
                </div>
              )}

              {/* Note section */}
              {showNote && (
                <div className="mt-2 animate-fade-in">
                  {editingNote ? (
                    <div className="flex flex-col gap-1.5">
                      <textarea
                        ref={noteRef}
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleNoteSave();
                          if (e.key === 'Escape') handleNoteCancel();
                        }}
                        placeholder="Add a note for this task…"
                        rows={2}
                        className="w-full text-xs bg-amber-500/5 border border-amber-400/20 rounded-lg px-2.5 py-2 text-amber-300/80 placeholder-amber-400/30 focus:outline-none focus:border-amber-400/50 resize-none leading-relaxed"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleNoteSave}
                          disabled={isSavingNote}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-[11px] font-bold hover:bg-amber-500/25 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Check size={10} />
                          {isSavingNote ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          onClick={handleNoteCancel}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-gray-400 dark:text-white/30 text-[11px] font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <X size={10} />
                          Cancel
                        </button>
                        {noteText.trim() && task.note && (
                          <button
                            onClick={() => { setNoteText(''); saveNote({ id: task.id, note: '' }, { onSuccess: () => { setEditingNote(false); setShowNote(false); } }); }}
                            className="ml-auto flex items-center gap-1 text-[11px] text-rose-400/60 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 size={9} /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ) : task.note ? (
                    <button
                      onClick={() => setEditingNote(true)}
                      className="flex items-start gap-1.5 w-full text-left group"
                    >
                      <StickyNote size={10} className="text-amber-400/55 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-400/65 leading-relaxed group-hover:text-amber-400/85 transition-colors">{task.note}</p>
                    </button>
                  ) : null}
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
                <span className="text-xs font-bold text-gray-600 dark:text-white/70">{task.priority}</span>
              </button>

              {/* AI reschedule — all incomplete tasks */}
              {!task.is_completed && (
                <button
                  onClick={handleReschedule}
                  disabled={isRescheduling}
                  title={rescheduled ? 'Rescheduled!' : 'AI reschedule'}
                  className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer disabled:opacity-40 ${
                    rescheduled
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-gray-300 dark:text-white/20 hover:text-sky-400 hover:bg-sky-500/10'
                  }`}
                >
                  <RefreshCw size={12} className={isRescheduling ? 'animate-spin' : ''} />
                </button>
              )}

              {/* Focus timer — incomplete tasks only */}
              {!task.is_completed && (
                <button
                  onClick={() => setShowFocusTimer(true)}
                  title="Start focus timer"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 dark:text-white/20 hover:text-[#ec5b13] hover:bg-[#ec5b13]/10 transition-all cursor-pointer"
                >
                  <Timer size={13} />
                </button>
              )}

              {/* Nag reminder toggle — overdue priority 1-2 only */}
              {isOverdueHighPriority && (
                <div className="relative">
                  <button
                    onClick={() => setShowNagPicker((v) => !v)}
                    title={task.nag_interval_minutes ? `Nagging every ${task.nag_interval_minutes}min` : 'Set nag reminder'}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                      task.nag_interval_minutes
                        ? 'text-orange-400 bg-orange-500/10'
                        : 'text-gray-300 dark:text-white/20 hover:text-orange-400 hover:bg-orange-500/10'
                    }`}
                  >
                    <BellRing size={12} />
                  </button>
                  {showNagPicker && (
                    <div className="absolute right-0 top-8 z-20 bg-white dark:bg-[#18181b] border border-gray-100 dark:border-white/10 rounded-xl shadow-lg p-1.5 min-w-[140px] animate-fade-in">
                      {NAG_OPTIONS.map((opt) => (
                        <button
                          key={String(opt.value)}
                          onClick={() => handleNagSelect(opt.value)}
                          className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                            task.nag_interval_minutes === opt.value
                              ? 'bg-orange-500/10 text-orange-400 font-bold'
                              : 'text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Share */}
              <button
                onClick={handleShare}
                disabled={isSharing}
                title={shareLink ? 'Link copied!' : 'Share task'}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                  shareLink
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-gray-300 dark:text-white/20 hover:text-blue-500 hover:bg-blue-500/10'
                }`}
              >
                {shareLink ? <Link2 size={13} /> : <Share2 size={13} />}
              </button>

              {/* Hover-reveal action buttons (complete + delete) — web swipe parity */}
              {!task.is_completed && (
                <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={() => complete(task.id)}
                    title="Mark complete"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[#10B981] bg-[#10B981]/10 hover:bg-[#10B981]/20 transition-all cursor-pointer"
                  >
                    <Check size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this task?')) remove(task.id);
                    }}
                    title="Delete task"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[#ef4444] bg-[#ef4444]/10 hover:bg-[#ef4444]/20 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Deadline progress bar */}
          {showBar && (
            <div className="px-4 pb-3 -mt-1">
              <div className="relative h-[3px] rounded-full overflow-hidden bg-gray-100 dark:bg-white/5">
                <div
                  className={`absolute left-0 top-0 h-full rounded-full transition-all duration-[60000ms] ease-linear ${barPulseClass}`}
                  style={{
                    width: `${deadline.progressPercent}%`,
                    background:
                      deadline.status === 'overdue'  ? '#ef4444' :
                      deadline.status === 'critical' ? 'linear-gradient(90deg, #3b82f6, #ef4444)' :
                      deadline.status === 'soon'     ? 'linear-gradient(90deg, #3b82f6, #eab308)' :
                                                       'linear-gradient(90deg, #3b82f6, #6366f1)',
                    boxShadow:
                      deadline.status === 'overdue'  ? '0 0 6px rgba(239,68,68,0.7)'  :
                      deadline.status === 'critical' ? '0 0 6px rgba(59,130,246,0.6)'  : 'none',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <OverrideDrawer task={task} field={activeField} onClose={() => setActiveField(null)} />
      {showFocusTimer && <FocusTimer task={task} onClose={() => setShowFocusTimer(false)} />}
    </>
  );
});
