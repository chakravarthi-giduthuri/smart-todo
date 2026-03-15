import { useState, useRef } from 'react';
import { CheckCircle2, Circle, Trash2, Plus, Loader2 } from 'lucide-react';
import { useSubtasks, useAddSubtask, useCompleteSubtask, useDeleteSubtask } from '../../hooks/useTasks';

interface Props { taskId: string; }

export function SubtaskList({ taskId }: Props) {
  const { data: subtasks = [], isLoading } = useSubtasks(taskId);
  const { mutate: addSub, isPending: isAdding } = useAddSubtask(taskId);
  const { mutate: completeSub } = useCompleteSubtask(taskId);
  const { mutate: deleteSub } = useDeleteSubtask(taskId);
  const [inputVal, setInputVal] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const title = inputVal.trim();
    if (!title) return;
    addSub(title, { onSuccess: () => setInputVal('') });
  }

  if (isLoading) return <div className="mt-2 pl-9 h-4 w-24 rounded-full bg-white/5 animate-pulse" />;

  const done = subtasks.filter((s) => s.is_completed).length;

  return (
    <div className="mt-2 pl-9">
      {subtasks.length > 0 && (
        <div className="mb-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">
              Subtasks {done}/{subtasks.length}
            </span>
            <div className="flex-1 h-[2px] rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-emerald-500/50 transition-all duration-300"
                style={{ width: subtasks.length > 0 ? `${(done / subtasks.length) * 100}%` : '0%' }}
              />
            </div>
          </div>
          <div className="space-y-0.5">
            {subtasks.map((s) => (
              <div key={s.id} className="group flex items-center gap-2 py-0.5">
                <button
                  onClick={() => !s.is_completed && completeSub(s.id)}
                  className="shrink-0 text-white/30 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {s.is_completed
                    ? <CheckCircle2 size={13} className="text-emerald-500/60" />
                    : <Circle size={13} />
                  }
                </button>
                <span className={`flex-1 text-xs ${s.is_completed ? 'line-through text-white/20' : 'text-white/60'}`}>
                  {s.title}
                </span>
                <button
                  onClick={() => deleteSub(s.id)}
                  className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-rose-400 transition-all cursor-pointer"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-1.5">
        <input
          ref={inputRef}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Add subtask..."
          className="flex-1 text-xs bg-white/5 rounded-lg px-2.5 py-1.5 text-white/60 placeholder-white/20 outline-none focus:bg-white/8 transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={isAdding || !inputVal.trim()}
          className="w-6 h-6 flex items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 disabled:opacity-30 transition-all cursor-pointer active:scale-90"
        >
          {isAdding ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
        </button>
      </div>
    </div>
  );
}
