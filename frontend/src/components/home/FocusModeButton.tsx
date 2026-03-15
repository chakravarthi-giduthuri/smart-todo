import { Target, X, Loader2 } from 'lucide-react';
import { useFocus } from '../../hooks/useFocus';
import type { Task } from '../../types/task';

interface Props { tasks: Task[]; }

export function FocusModeButton({ tasks }: Props) {
  const { data, isLoading, error, fetchFocus, clear } = useFocus();

  const focusTask = data ? tasks.find((t) => t.id === data.task.id) ?? data.task : null;

  return (
    <div className="mx-4 mb-3">
      {!focusTask ? (
        <button
          onClick={fetchFocus}
          disabled={isLoading || tasks.filter((t) => !t.is_completed).length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl glass border border-indigo-500/20 text-indigo-400 text-sm font-bold hover:bg-indigo-500/10 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40"
        >
          {isLoading
            ? <><Loader2 size={15} className="animate-spin" /><span>Thinking...</span></>
            : <><Target size={15} /><span>What should I do now?</span></>
          }
        </button>
      ) : (
        <div className="rounded-2xl glass border border-indigo-500/30 p-4 animate-fade-in">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Target size={13} className="text-indigo-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Focus now</span>
            </div>
            <button onClick={clear} className="text-white/25 hover:text-white/60 transition-colors cursor-pointer"><X size={13} /></button>
          </div>
          <p className="text-sm font-bold text-white mt-1">{focusTask.title}</p>
          <p className="text-xs text-white/40 mt-1 leading-relaxed">{data?.reason}</p>
        </div>
      )}
      {error && <p className="text-xs text-rose-400 mt-1 text-center">{error}</p>}
    </div>
  );
}
