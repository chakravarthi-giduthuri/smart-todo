import { useDashboard } from '../../hooks/useDashboard';

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

export function ProductivitySnapshot() {
  const { data: stats } = useDashboard();

  return (
    <div className="bg-white dark:bg-[#18181b] rounded-2xl p-6 soft-shadow border border-gray-100 dark:border-white/[0.08]">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Productivity Snapshot</h3>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 mb-3" style={{ height: '96px' }}>
        {stats?.week_chart?.map((bar, i) => {
          const maxH = Math.max(...(stats.week_chart?.map(b => b.total) ?? [1]), 1);
          const h = Math.max((bar.total / maxH) * 100, 4);
          const today = new Date().toISOString().split('T')[0];
          const isToday = bar.date === today;
          return (
            <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 h-full">
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: `${h}%`, background: isToday ? '#3b82f6' : '#dbeafe' }}
              />
              <span className={`text-[9px] font-bold uppercase tracking-wide ${isToday ? 'text-blue-600' : 'text-gray-400 dark:text-white/30'}`}>
                {DAYS[i]}
              </span>
            </div>
          );
        }) ?? DAYS.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end items-center gap-1 h-full">
            <div className="w-full rounded-t-md bg-blue-100 dark:bg-white/5" style={{ height: '10%' }} />
            <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400 dark:text-white/30">{d}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50 dark:border-white/5">
        <div>
          <p className="text-[10px] text-gray-400 dark:text-white/30 font-bold uppercase tracking-wider">Completed</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
            {stats?.completed_today ?? 0}{' '}
            <span className="text-xs font-normal text-emerald-500">+{stats?.completion_rate ?? 0}%</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 dark:text-white/30 font-bold uppercase tracking-wider">Streak</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
            {stats?.streak_days ?? 0}{' '}
            <span className="text-xs font-normal text-gray-400 dark:text-white/30">days</span>
          </p>
        </div>
      </div>
    </div>
  );
}
