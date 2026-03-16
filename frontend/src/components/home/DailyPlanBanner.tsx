import { Link } from 'react-router-dom';
import { ClipboardList, ArrowRight } from 'lucide-react';
import { useDailyPlan } from '../../hooks/useDashboard';

interface DailyPlanBannerProps {
  date: string;
}

export function DailyPlanBanner({ date }: DailyPlanBannerProps) {
  const { data: plan } = useDailyPlan(date);

  const hasPlan = plan && plan.task_ids && plan.task_ids.length > 0;

  if (!hasPlan) {
    return (
      <Link
        to="/plan"
        className="flex items-center gap-3 px-4 py-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-xl hover:bg-primary/10 dark:hover:bg-primary/15 transition-colors group"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
          <ClipboardList size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-primary">Start your daily plan</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Commit to tasks and set your goal for today</p>
        </div>
        <ArrowRight size={16} className="text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    );
  }

  const taskCount = plan.task_ids.length;
  const goalText = plan.goal?.trim() || null;

  return (
    <Link
      to="/plan"
      className="flex items-center gap-3 px-4 py-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-xl hover:bg-primary/10 dark:hover:bg-primary/15 transition-colors group"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
        <ClipboardList size={16} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Today's Plan: {goalText ? <span className="text-primary">{goalText}</span> : `${taskCount} task${taskCount !== 1 ? 's' : ''} committed`}
        </p>
        {goalText && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {taskCount} task{taskCount !== 1 ? 's' : ''} committed
          </p>
        )}
      </div>
      <ArrowRight size={16} className="text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
