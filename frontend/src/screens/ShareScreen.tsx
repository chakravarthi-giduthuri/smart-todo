import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, Calendar, Clock, Loader2, Sparkles } from 'lucide-react';
import { getShare, completeShare } from '../api/shares';
import type { PublicShare } from '../api/shares';
import { formatDate, formatTime } from '../utils/dateFormat';
import { CATEGORY_COLORS } from '../constants/categories';
import type { Category } from '../types/task';

export function ShareScreen() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicShare | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!token) return;
    getShare(token)
      .then((d) => { setData(d); setIsLoading(false); })
      .catch((e) => { setError(e.message); setIsLoading(false); });
  }, [token]);

  async function handleComplete() {
    if (!token || completing) return;
    setCompleting(true);
    try {
      await completeShare(token);
      setCompleted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setCompleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <Loader2 size={24} className="text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-white/60 text-sm">Task not found or link has expired.</p>
        </div>
      </div>
    );
  }

  const task = data.task;
  const catColor = CATEGORY_COLORS[task.category as Category];

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-xl bg-gradient-accent flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles size={13} className="text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">Smart To-Do</span>
        </div>

        <div className="glass rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Shared task</p>

          <span
            className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3"
            style={{ backgroundColor: `${catColor}20`, color: catColor }}
          >
            {task.category}
          </span>

          <h1 className="text-xl font-extrabold text-white leading-snug mb-4">{task.title}</h1>

          {task.note && (
            <p className="text-sm text-white/50 mb-4 leading-relaxed">{task.note}</p>
          )}

          {(task.scheduled_date || task.scheduled_time) && (
            <div className="flex items-center gap-3 text-xs text-white/40 mb-6">
              {task.scheduled_date && (
                <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(task.scheduled_date)}</span>
              )}
              {task.scheduled_time && (
                <span className="flex items-center gap-1"><Clock size={11} />{formatTime(task.scheduled_time)}</span>
              )}
            </div>
          )}

          {completed ? (
            <div className="flex items-center gap-2 text-emerald-400 justify-center py-3">
              <CheckCircle2 size={20} />
              <span className="font-bold">Marked as done!</span>
            </div>
          ) : (
            <button
              onClick={handleComplete}
              disabled={completing}
              className="w-full py-3.5 rounded-2xl bg-gradient-accent text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-500/30"
            >
              {completing
                ? <><Loader2 size={16} className="animate-spin" /><span>Marking done...</span></>
                : <><CheckCircle2 size={16} /><span>Mark as Complete</span></>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
