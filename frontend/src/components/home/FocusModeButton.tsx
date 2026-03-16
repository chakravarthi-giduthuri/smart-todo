import { useEffect, useState } from 'react';
import { Target, X, Loader2, Timer } from 'lucide-react';
import { useFocus } from '../../hooks/useFocus';
import { FocusTimer } from '../tasks/FocusTimer';
import type { Task } from '../../types/task';

interface Props { tasks: Task[]; }

export function FocusModeButton({ tasks }: Props) {
  const { data, isLoading, error, fetchFocus, clear } = useFocus();
  const focusTask = data?.task ? (tasks.find((t) => t.id === data.task!.id) ?? data.task) : null;
  const incompleteTasks = tasks.filter((t) => !t.is_completed);
  const allDone = incompleteTasks.length === 0;
  const [showTimer, setShowTimer] = useState(false);

  // Keyboard shortcut: press 'w' to trigger "What Now?"
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'w' || e.key === 'W') {
        if (!focusTask && !isLoading && !allDone) fetchFocus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusTask, isLoading, allDone, fetchFocus]);

  return (
    <div className="mx-4 mb-3">
      {!focusTask ? (
        allDone ? (
          <div
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-emerald-600 dark:text-emerald-400 text-sm font-semibold"
            style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
          >
            <span>You're all caught up! 🎉</span>
          </div>
        ) : (
          <button
            onClick={fetchFocus}
            disabled={isLoading}
            title="Press W for What Now"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[#ec5b13] text-sm font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-40"
            style={{ background: 'rgba(236,91,19,0.08)', border: '1px solid rgba(236,91,19,0.2)' }}
          >
            {isLoading
              ? <><Loader2 size={15} className="animate-spin" /><span>Thinking...</span></>
              : <><Target size={15} /><span>What should I do now?</span></>
            }
          </button>
        )
      ) : (
        <div
          className="rounded-xl p-4 animate-scale-in-bounce"
          style={{ background: 'rgba(236,91,19,0.08)', border: '1px solid rgba(236,91,19,0.25)' }}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Target size={13} className="text-[#ec5b13] shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#ec5b13]">Focus now</span>
            </div>
            <button onClick={clear} className="text-slate-400 dark:text-white/25 hover:text-slate-600 dark:hover:text-white/60 transition-colors cursor-pointer"><X size={13} /></button>
          </div>
          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">{focusTask.title}</p>
          <p className="text-xs text-slate-500 dark:text-white/40 mt-1 leading-relaxed">{data?.reason}</p>
          <button
            onClick={() => setShowTimer(true)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#ec5b13] hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Timer size={12} />
            Start 25min Timer
          </button>
        </div>
      )}
      {error && <p className="text-xs text-rose-400 mt-1 text-center">{error}</p>}
      {showTimer && focusTask && (
        <FocusTimer task={focusTask} onClose={() => setShowTimer(false)} />
      )}
    </div>
  );
}
