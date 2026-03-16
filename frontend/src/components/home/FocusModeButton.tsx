import { Target, X, Loader2 } from 'lucide-react';
import { useFocus } from '../../hooks/useFocus';
import type { Task } from '../../types/task';

interface Props { tasks: Task[]; }

export function FocusModeButton({ tasks }: Props) {
  const { data, isLoading, error, fetchFocus, clear } = useFocus();
  const focusTask = data?.task ? (tasks.find((t) => t.id === data.task!.id) ?? data.task) : null;

  return (
    <div className="mx-4 mb-3">
      {!focusTask ? (
        <button
          onClick={fetchFocus}
          disabled={isLoading || tasks.filter((t) => !t.is_completed).length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[#ec5b13] text-sm font-semibold transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-40"
          style={{ background: 'rgba(236,91,19,0.08)', border: '1px solid rgba(236,91,19,0.2)' }}
        >
          {isLoading
            ? <><Loader2 size={15} className="animate-spin" /><span>Thinking...</span></>
            : <><Target size={15} /><span>What should I do now?</span></>
          }
        </button>
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
        </div>
      )}
      {error && <p className="text-xs text-rose-400 mt-1 text-center">{error}</p>}
    </div>
  );
}
