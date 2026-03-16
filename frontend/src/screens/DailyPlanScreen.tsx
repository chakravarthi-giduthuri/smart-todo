import { useState, useEffect } from 'react';
import { ClipboardList, ChevronUp, ChevronDown, Plus, Minus, Save } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { useDailyPlan, useUpsertDailyPlan } from '../hooks/useDashboard';
import type { Task } from '../types/task';

function formatTodayDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

const CATEGORY_COLORS: Record<string, string> = {
  Work:     'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
  Study:    'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400',
  Personal: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  Health:   'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
  Errand:   'bg-pink-100 dark:bg-pink-500/20 text-pink-600 dark:text-pink-400',
};

const PRIORITY_COLORS: Record<number, string> = {
  1: 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400',
  2: 'bg-orange-100 dark:bg-orange-500/20 text-orange-500',
  3: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  4: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
  5: 'bg-slate-100 dark:bg-slate-800 text-slate-400',
};

function TaskRow({ task, action }: { task: Task; action: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{task.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[task.category] ?? 'bg-slate-100 text-slate-500'}`}>
            {task.category}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority] ?? 'bg-slate-100 text-slate-400'}`}>
            P{task.priority}
          </span>
          {task.duration_minutes != null && (
            <span className="text-[10px] text-slate-400">{task.duration_minutes}m</span>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

export function DailyPlanScreen() {
  const today = new Date().toISOString().split('T')[0];
  const { data: allTasks = [] } = useTasks();
  const { data: existingPlan } = useDailyPlan(today);
  const upsert = useUpsertDailyPlan();

  const [goal, setGoal] = useState('');
  const [committedIds, setCommittedIds] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  // Sync from server once loaded
  useEffect(() => {
    if (existingPlan) {
      setGoal(existingPlan.goal ?? '');
      const order = existingPlan.plan_order ?? existingPlan.task_ids ?? [];
      setCommittedIds(order);
    }
  }, [existingPlan]);

  const availableTasks: Task[] = allTasks
    .filter((t) => !t.is_completed && !committedIds.includes(t.id))
    .sort((a, b) => a.priority - b.priority);

  const committedTasks: Task[] = committedIds
    .map((id) => allTasks.find((t) => t.id === id))
    .filter((t): t is Task => t != null);

  function addTask(task: Task) {
    setCommittedIds((prev) => [...prev, task.id]);
    setSaved(false);
  }

  function removeTask(taskId: string) {
    setCommittedIds((prev) => prev.filter((id) => id !== taskId));
    setSaved(false);
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setCommittedIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
    setSaved(false);
  }

  function moveDown(index: number) {
    if (index === committedIds.length - 1) return;
    setCommittedIds((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    await upsert.mutateAsync({
      plan_date: today,
      task_ids: committedIds,
      plan_order: committedIds,
      goal: goal.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 md:pb-8" style={{ background: 'var(--app-bg)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 md:px-8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <ClipboardList size={18} className="text-primary" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">Plan Your Day</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{formatTodayDate()}</p>
        </div>
      </header>

      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full flex flex-col gap-6">
        {/* Goal input */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">
            What's your #1 goal today?
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => { setGoal(e.target.value); setSaved(false); }}
            placeholder="e.g. Finish the project proposal draft"
            maxLength={150}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
          />
        </div>

        {/* Two-column layout (stacked on mobile) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Available Tasks */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Available Tasks</h2>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {availableTasks.length}
              </span>
            </div>
            {availableTasks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-6 text-center">
                <p className="text-sm text-slate-400 italic">All incomplete tasks are committed or none exist.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {availableTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    action={
                      <button
                        onClick={() => addTask(task)}
                        className="w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors cursor-pointer shrink-0"
                        title="Add to plan"
                      >
                        <Plus size={16} />
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </div>

          {/* Today's Commitments */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Today's Commitments</h2>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {committedTasks.length}
              </span>
            </div>
            {committedTasks.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-6 text-center">
                <p className="text-sm text-slate-400 italic">Add tasks from the left to commit to them.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {committedTasks.map((task, index) => (
                  <div key={task.id} className="flex items-stretch gap-2">
                    {/* Order controls */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="flex-1 w-7 flex items-center justify-center rounded-t-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
                        title="Move up"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === committedTasks.length - 1}
                        className="flex-1 w-7 flex items-center justify-center rounded-b-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors cursor-pointer disabled:cursor-default"
                        title="Move down"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>

                    {/* Task card */}
                    <div className="flex-1 min-w-0">
                      <TaskRow
                        task={task}
                        action={
                          <button
                            onClick={() => removeTask(task.id)}
                            className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center justify-center text-red-500 transition-colors cursor-pointer shrink-0"
                            title="Remove from plan"
                          >
                            <Minus size={16} />
                          </button>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={upsert.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm shadow-sm shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60 cursor-pointer disabled:cursor-default"
          >
            <Save size={16} />
            {upsert.isPending ? 'Saving…' : saved ? 'Saved!' : 'Save Plan'}
          </button>
        </div>
      </div>
    </div>
  );
}
